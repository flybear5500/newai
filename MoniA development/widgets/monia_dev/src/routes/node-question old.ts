// === Imports ===
// External Libraries
import express from 'express';
import { Router } from 'express';
import JSON5 from 'json5';
import { finished } from 'stream';
import { oneLine } from 'common-tags';
import { Vonage } from '@vonage/server-sdk';

// Configs and Utilities
import { getConfig } from '../config/index.js';
import sanitizeInput from '../utils/sanitizeInput.js';
import { CustomPromptTemplate, CustomOutputParser } from '../utils/localized.js';
import { deductCredits, validateNumber } from '../utils/credits.js';

// Local Libraries
import { logChat, logOwnChat, getLogFilename } from '../chatLogger.js';
import { getMemoryVectorStore, addDocumentsToMemoryVectorStore, getBufferWindowMemory } from '../lib/memoryManager.js';
import { tokenCounter, initializeTools } from '../tools/tools.js';

// Types
import { CustomRequest } from '../models/UserEnvironment.js';

// import { LLMChain } from 'langchain/chains';
import {
  ConstitutionalPrinciple,
  ConstitutionalChain,
  LLMChain,
} from "langchain/chains";
import { ChatOpenAI } from 'langchain/chat_models/openai';

// import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { AgentExecutor, initializeAgentExecutorWithOptions, ChatConversationalAgentOutputParser } from 'langchain/agents';
// import { PlanAndExecuteAgentExecutor } from "langchain/experimental/plan_and_execute";

import { BaseCallbackHandler } from 'langchain/callbacks';
import { Serialized } from 'langchain/load/serializable';
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  PromptTemplate,
} from 'langchain/prompts';


// === Constants ===
const router = Router();
const bufferWindowMemoryMap = new Map();
// Un objet pour suivre le nombre de questions pour chaque utilisateur avec actid = 0
const counterForZeroActid: { [msisdn: string]: number } = {};

// === Middlewares ===
const sseMiddleware = (_req: CustomRequest, res: express.Response, next: express.NextFunction) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  // If the connection is closed by the client, we need to stop sending events
  const onFinished = () => {
    res.end();
  };
  finished(res, onFinished);
  next();
};




// === Business Logic ===
router.post(
  '/',
  sseMiddleware,
  (_req: CustomRequest, _res: express.Response, next: express.NextFunction) => {
    next();
  },
  async (req: CustomRequest, res: express.Response) => {
    //     check if token is valid
    if (!req.userEnv) {
      res.status(401).send({ message: 'Invalid token' });
      return;
    }

    if (req.isSMSNetworkRequest) {
      req.body.prompt = req.body.text;
      //todo : find the user and its perms from its req.body.msisdn in the DB
    }

//     console.log('Received request:', req.body);

    if (!req.body || !req.body.prompt) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Le champ "prompt" est obligatoire' })}\n\n`);
      res.end();
      return;
    }

    //     console.log('credits : ', req.userEnv.credits);
    if (req.userEnv.credits < 1) {
      res.write(
        `data: ${JSON.stringify({
          token:
            "Je ne peux plus vous répondre, vous devriez demandez au propriétaire de ce site de <a href='https://cercle.business/recharge-de-credits'>recharger ses crédits disponibles</a> pour de nouvelles réponses.",
        })}\n\n`
      );
      res.write(`data: ${JSON.stringify({ message: '[DONE]' })}\n\n`);
      return;
    }
    //   const userid = req.body.user;
    const actid = req.body.actid;
    const user_privacy = req.body.actid_perms || 1; //default public user
//     const isUserHolder = req.userEnv.joomId === actid;
    //   const base = req.body.base;
    const question = sanitizeInput(req.body.prompt);
    const data_website = req.body.data_website || 'sms';
//     const chat_file = req.body.chat_file;
    //   const last_questions = req.body.last_questions;
    //   const last_answers = req.body.last_answers;
    const language = req.body.lang || 'fr';
//     const config = getConfig();
    const userEnv = req.userEnv;

    tokenCounter.total = 0;
    
//     req.body.msisdn = '33610963368';

    const envTools = {
      userEnv: req.userEnv,
      intelligence: req.userEnv.intelligence === 1 ? 'gpt-4-0613' : 'gpt-3.5-turbo-0613',
      actid: req.body.actid,
      user_privacy: req.body.actid_perms || 1,
      isUserHolder: req.userEnv.joomId === actid,
      msisdn: req.body.msisdn || 0,
      ownerAtid: req.userEnv.atid || 0,
      userFunction1 : req.userEnv.function_1,
//       lang: req.body.lang,
    };

    const chatLogDirectory = req.userEnv.chatLogDirectory;
    const chatLogActidDirectory = `chat_logs/` + actid;

    const systemPromptTemplate = req.userEnv.systemPromptTemplate;
    const systemPrompt = SystemMessagePromptTemplate.fromTemplate(oneLine`
	  ${systemPromptTemplate}` + ` You MUST always think, interact and send queries in English only; then you MUST translate the Final Answer in the ` + language + ` language.`);
//  	console.log(systemPrompt);
// 		const systemPrompt = systemPrompt + `You MUST always think, interact and answer in the language whose short tag is :` + language;

//     const chatPrompt = ChatPromptTemplate.fromPromptMessages([
//       systemPrompt,
//       HumanMessagePromptTemplate.fromTemplate('QUESTION: """{input}"""'),
//     ]);

    //     console.log(chatPrompt);

    let windowMemory = bufferWindowMemoryMap.get(actid);
    if (!windowMemory) {
      windowMemory = getBufferWindowMemory(req.userEnv);
      bufferWindowMemoryMap.set(actid, windowMemory);
    }
//         console.log('window_memory : ', windowMemory);

    // You can implement your own callback handler by extending BaseCallbackHandler
    class CustomHandler extends BaseCallbackHandler {
      name = 'custom_handler';

      //TODO :  calculer les token pour le prompt dans le cas de streaming

      handleLLMNewToken(token: string) {
        res.write(`data: ${JSON5.stringify({ token })}\n`);
        //       res.write(`data: ${token}\n\n`);
//         console.log('data: ', JSON5.stringify({ token }));
        tokenCounter.total++;
      }

		handleLLMEnd(output: LLMOutput, _prompts: string[]) {
		  try {
// 			console.log('Contenu complet de output:', JSON.stringify(output, null, 2));
			if (output?.llmOutput?.tokenUsage) {
			  if (typeof output.llmOutput.tokenUsage.totalTokens === 'number') {
				tokenCounter.total += output.llmOutput.tokenUsage.totalTokens;
			  } else {
				console.error(
				  'output.llmOutput.tokenUsage.totalTokens is not a number:',
				  output.llmOutput.tokenUsage.totalTokens
				);
			  }
			} else {
			  console.error('output.llmOutput ou output.llmOutput.tokenUsage est undefined');
			}
		  } catch (error) {
			console.error('Error in processing llmOutput: ', error);
		  }
		  //TODO: renvoyer la réponse par SMS à actid
		}


      handleChainStart(chain: Serialized) {
//         console.log('handleChainStart', { chain });
      }

      handleAgentAction(action: AgentAction) {
//         console.log('handleAgentAction', action);
      }

      handleToolStart(tool: Serialized) {
//         console.log('handleToolStart', { tool });
      }
    }

    const handler1 = new CustomHandler();

    const tools = await initializeTools(envTools);
    
    const toolNames = tools.map(tool => tool.name); 

		const parser = new ChatConversationalAgentOutputParser({ toolNames: toolNames });
    		
		const formatInstructions = parser.getFormatInstructions(tools);
		
// 		console.log('format instructions ', formatInstructions);

		const instructionsWithLang = formatInstructions + ' Remember that you MUST translate the Final Answer in the ' + language + ' language.\n';

// 		console.log('format instructions with lang ', instructionsWithLang);

    const model = new ChatOpenAI({
      //important ! streaming disables tokenusage
      streaming: true,
      maxConcurrency: 10,
      modelName: req.userEnv.intelligence === 1 ? 'gpt-4-0613' : 'gpt-3.5-turbo-0613',
      frequencyPenalty: validateNumber(req.userEnv.frequence, 0.6),
      presencePenalty: validateNumber(req.userEnv.presence, 0),
      //       temperature: validateNumber(req.userEnv.temperature, 0.3),
      temperature: 0,
    });
    
    //ethical and language
//     const principle = new ConstitutionalPrinciple({
// 			name: "Language Principle",
// 			critiqueRequest: "The model should only answer in the language of the first question asked by the human user.",
// 			revisionRequest: "Rewrite the model's output to be in the language of the question asked.",
// 		});
// 		
// 		const chain = ConstitutionalChain.fromLLM(model, {
// 			chain: question,
// 			constitutionalPrinciples: [principle],
// 		});
    
    //main agent
    const executor = await initializeAgentExecutorWithOptions(tools, model, {
      agentType: 'chat-conversational-react-description',
      verbose: false,
      outputParser: instructionsWithLang,
      agentArgs: {
        systemMessage: systemPromptTemplate,
      },
      memory: windowMemory,
//       stop: ["\nObservation", "Final Answer"],
    });    

    let response;
    //     testFilter();
    
    
    //start SMS flow for non registered users
//     if (actid === 0) {
    if (true) {			
      // Utiliser req.body.msisdn pour suivre cet utilisateur spécifique
      const msisdn = req.body.msisdn;

//TODO créer la table pour passer la gestion du compteur sur la BD
// pour la table rajouter le joomid le numéro de tel de l'utilisateur, le code 
// CREATE TABLE sms_counter (
//   msisdn VARCHAR(15) PRIMARY KEY,
//   count INT NOT NULL DEFAULT 1
// );
// 
// INSERT INTO sms_counter (msisdn, count) VALUES (?, 1)
// ON DUPLICATE KEY UPDATE count = count + 1;
// 
// const msisdn = req.body.msisdn;
// const connection = await pool.getConnection();
// await connection.execute(
//   "INSERT INTO sms_counter (msisdn, count) VALUES (?, 1) ON DUPLICATE KEY UPDATE count = count + 1",
//   [msisdn]
// );
// connection.release();

// const [rows]: [RowDataPacket[], FieldPacket[]] = await connection.query(
//    "SELECT count FROM sms_counter WHERE msisdn = ?", [msisdn]
// );
// const currentCount = rows[0]?.count || 0;
// if (currentCount > 4) {
//    // Votre logique pour gérer la limite dépassée
// }
// 
// connection.release();


      
      // Initialiser le compteur pour cet utilisateur s'il n'existe pas encore
      if (!counterForZeroActid[msisdn]) {
        counterForZeroActid[msisdn] = 0;
      }
      // Incrémenter le compteur
      counterForZeroActid[msisdn]++;
      
      console.log('counter sms ', counterForZeroActid);

      // Vérifier si l'utilisateur a atteint la limite de questions
//         if (counterForZeroActid[msisdn] > 4) {
				      if (true) {
				      
						const smschat = new ChatOpenAI({ modelName: "gpt-4", temperature: 0 });
			
						const input = "You need to register me " + question;
						const toolName = "UserRegistration";
		
						const action = {
							tool: toolName,
							toolInput: {
							input: input,
							},
						};
						
						const smsPrompt = `You are a helpful assistant which will register me on cercle.business. You MUST respond in the original language of the first question asked.`;

						const smsagent = await initializeAgentExecutorWithOptions(tools, smschat, {
							agentType: "openai-functions",
							agentArgs: {
								prefix: smsPrompt,
							},
						}); 						
						
			
						//copy response to chat	
						let smsresponse
						smsresponse = await smsagent.call(
							{
								input: input,
								action : action
							},
							[handler1]
							);		  
						res.write(`data: ${JSON.stringify({ message: '[DONE]' })}\n\n`);			
					
						//send sms response
						const vonage = new Vonage({
								apiKey: String(req.userEnv.token),
								apiSecret: String(req.userEnv.secret),
							});
						const to = String(req.body.msisdn);
						const from = String(req.body.to);
						const text = response.output;
						const opts = {
							type: 'unicode',
						};

						async function sendSMS() {
							await vonage.sms
								.send({ to, from, text, ...opts })
								.then((resp) => {
									console.log('Message sent successfully');
									console.log(resp);
								})
								.catch((err) => {
									console.log('There was an error sending the messages.');
									console.error(err);
								});
						}

						sendSMS();
				}
										res.end();
						return;
    }
		//end SMS for non registered
			
    try {
      response = await executor.call(
        {
          input: question,
        },
        [handler1]
      );

      let memoryVectorStore;
      try {
        memoryVectorStore = await getMemoryVectorStore(userEnv);
      } catch (error) {
        console.error('Erreur lors de la récupération du memoryVectorStore:', error);
      }

      if (response) {
        
        res.write(`data: ${JSON.stringify({ message: '[DONE]' })}\n\n`);
        
        const filename = await getLogFilename(String(actid));

        await addDocumentsToMemoryVectorStore(req.userEnv, memoryVectorStore, [
          { content: question, metadataType: 'question', filename: filename, isPrivate: user_privacy, actid: actid },
          {
            content: response.output,
            metadataType: 'answer',
            filename: filename,
            isPrivate: user_privacy,
            actid: actid,
          },
        ]);

        console.log(`Total tokens used: `, tokenCounter.total);
        
        //log chat for owner
        await logChat(chatLogDirectory, String(actid), question, response.output, data_website);
        //also log chat for user
        console.log('chat directory userid ', chatLogDirectory);
        console.log('chat directory actid ', chatLogActidDirectory);
        await logOwnChat(chatLogActidDirectory, String(req.userEnv.joomId), question, response.output, data_website);


//         envoi sms si sms network 
        if (req.isSMSNetworkRequest) {
          const vonage = new Vonage({
            apiKey: String(req.userEnv.token),
            apiSecret: String(req.userEnv.secret),
            			  // apiKey: '8cc49b4e',
//             			  apiSecret: 'gNoE0Ye8wzZp3ELV'
          });
          const to = String(req.body.msisdn);
//           		  const to = '33610963368';
//           		  const from = '33644631717';
          const from = String(req.body.to);
          const text = response.output;
          const opts = {
            type: 'unicode',
          };

          function sendSMS() {
             vonage.sms
              .send({ to, from, text, ...opts })
              .then((resp) => {
                console.log('Message sent successfully');
                console.log(resp);
              })
              .catch((err) => {
                console.log('There was an error sending the messages.');
                console.error(err);
              });
          }

          sendSMS();
        }   

        await deductCredits(req.userEnv.joomId, tokenCounter.total, req.userEnv.intelligence, res);
      } else {
        res.write(
          `data: ${JSON.stringify({
            message: '[ERROR]: Les serveurs sont en maintenance, merci de renouveler la demande plus tard.',
          })}\n\n`
        );
      }
    } catch (err) {
      console.error('Error in chat chain:', err);
      res.write(`event: error\ndata: ${JSON.stringify({ message: (err as Error).message })}\n\n`);
      res.end();
      return;
    }

    res.end();
  }
);

export default router;
