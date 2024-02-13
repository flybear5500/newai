// === Imports ===
// External Libraries
import WebSocket from 'ws';
import axios from 'axios';
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
import { getRelevantContext } from '../lib/vectorStoreUtils.js';
import { tokenCounter, initializeTools } from '../tools/tools.js';
import { handleSmsAgent, sendSmsResponse } from '../agents/smsRegistrationAgent';
import { handleMainMoniaAgent } from '../agents/agentMoniAmain.ts';
import { getContextVectorStore } from '../lib/contextManager.js';

// Types
import { CustomRequest } from '../models/UserEnvironment.js';

// import { LLMChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';

// import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { AgentActionOutputParser, initializeAgentExecutorWithOptions, ChatConversationalAgentOutputParser } from 'langchain/agents';
// import { PlanAndExecuteAgentExecutor } from "langchain/experimental/plan_and_execute";

import { BaseCallbackHandler } from 'langchain/callbacks';
import { Serialized } from 'langchain/load/serializable';
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  PromptTemplate,
} from 'langchain/prompts/load';

// === Constants ===
const router = Router();
const bufferWindowMemoryMap = new Map();

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

let response;

// === Function to deal with process_question promises ===
function handleWebSocket(question, envTools) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket('ws://localhost:4100/process_question');

        ws.on('open', function open() {
            console.log("Connected to Python application via WebSocket");
            const questionData = {
                question: question,
                envTools: envTools
            };
            ws.send(JSON.stringify(questionData));
        });

        ws.on('message', function incoming(data) {
            const responseString = data.toString();
            try {
                const response = JSON.parse(responseString);
                console.log('Response as object:', response);
                resolve(response); 
            } catch (error) {
                console.error('Erreur lors de la conversion de la réponse en JSON:', error);
                reject(error); 
            }
        });

        ws.on('error', function error(error) {
            console.error('Erreur lors de la connexion à API Python via WebSocket:', error);
            reject(error);
        });
    });
}


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
    const config = getConfig();
    const userEnv = req.userEnv;
    
//      console.log(userEnv);

    tokenCounter.total = 0;
    
    const chatLogDirectory = req.userEnv.chatLogDirectory;
    const chatLogActidDirectory = `chat_logs/` + actid;

    const systemPromptTemplate = req.userEnv.systemPromptTemplate;
    
    const systemPrompt = systemPromptTemplate + ` Par dessus tout l'assistant MoniA DOIT traduire sa réponse finale dans la langue dont le code commence par : ` + language + ` .`;
    
//   	console.log('Prompt modifié: ', systemPrompt);

//     const chatPrompt = ChatPromptTemplate.fromPromptMessages([
//       systemPrompt,
//       HumanMessagePromptTemplate.fromTemplate('QUESTION: """{input}"""'),
//     ]);

    //     console.log(chatPrompt);
    
//     req.userEnv.systemPromptTemplate['prompt'] = systemPrompt;


    
    const envTools = {
      userEnv: req.userEnv,
      intelligence: req.userEnv.intelligence === 1 ? 'gpt-4-1106-preview' : 'gpt-3.5-turbo',
      actid: req.body.actid,
      user_privacy: req.body.actid_perms || 1,
      isUserHolder: req.userEnv.joomId === actid,
      msisdn: req.body.msisdn || 0,
//       msisdn: '336109643368',
      ownerAtid: req.userEnv.atid || 0,
      userFunction1 : req.userEnv.function_1,
      lang: req.body.lang,
      agentPrompt: systemPrompt,
    };    

// 		console.log('requete: ', req.body);
// 		console.log ('actid: ', actid);
    //start agent SMS flow for non registered users
	 if (actid === 0) {
	//     if (true) {			
				let response = await handleSmsAgent(question, envTools, req);
				console.log('smsagent reponse', response);
				if(response) {
					await sendSmsResponse(req.userEnv, response, req);
					res.end();
					return;
				}
			} 
	//end SMS for non registered   
		
//NEW DEV PYTHON FASTAPI		

    if (actid === 11875) {
        try {
            const response = await handleWebSocket(question, envTools);
            res.write(`data: ${JSON.stringify( response )}\n\n`);
            res.end();
        } catch (error) {
            console.error('Erreur lors de la communication avec WebSocket:', error);
            res.write(`event: error\ndata: ${JSON.stringify({ message: 'Erreur de connexion au serveur' })}\n\n`);
            res.end();
        }
    }

					
			
		if (actid !== 11875) {	
			//begin normla agent process	
			let windowMemory = bufferWindowMemoryMap.get(actid);
			if (!windowMemory) {
				windowMemory = getBufferWindowMemory(req.userEnv);
				bufferWindowMemoryMap.set(actid, windowMemory);
			}
	//         console.log('window_memory : ', windowMemory);

    let contextVectorStore;
    try {
      contextVectorStore = await getContextVectorStore(req.userEnv);
      // 	console.log('Loaded contextVectorStore:', contextVectorStore);
    } catch (error) {
      // 	console.error('Error loading contextVectorStore:', error);
      res.write(
        `event: error\ndata: ${JSON.stringify({ message: 'Erreur lors du chargement de contextVectorStore' })}\n\n`
      );
      res.end();
      return;
    }
    
    let context;
    try {
      context = await getRelevantContext(
        contextVectorStore,
        question,
        config.numContextDocumentsToRetrieve,
        envTools.user_privacy,
        envTools.isUserHolder
      );
      //       console.log('Retrieved context:', context);
    } catch (error) {
      console.error('Error retrieving context:', error);
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Erreur lors de la récupération du contexte' })}\n\n`);
      res.end();
      return;
    }    

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
	// 			  console.error('output.llmOutput ou output.llmOutput.tokenUsage est undefined');
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
	//     console.log('toolnames', toolNames);

	// 		const parser = new ChatConversationalAgentOutputParser({ toolNames: toolNames });
	// 		
	// 		//if "Final Answer:" in llm_output, then add translate (chain or agent to correct language, then return values) 
	//     		
	// 		const formatInstructions = parser.getFormatInstructions(tools);
	// 		
	// // 		console.log('format instructions ', formatInstructions);
	// 
	// 		const instructionsWithLang = formatInstructions + '\n Remember that you MUST translate the Final Answer in the ' + language + ' language.\n';

	// 		console.log('format instructions with lang ', instructionsWithLang);

			class CustomOutputParser extends ChatConversationalAgentOutputParser {
			constructor(fields: { toolNames: string[] }) {
					super(fields);
					this.toolNames = fields.toolNames;
			}

				getFormatInstructions(): string {
					const formatInstructions = super.getFormatInstructions();
					return formatInstructions + '\n Lorsque tu réponds, rappelle toi que tu DOIS répondre dans la langue dont le code commence par: ' + language + '.\n';
				}
			}
		
	const ParserWithLang = new CustomOutputParser({ toolNames: toolNames });

// 	console.log('newformatinstructions', ParserWithLang.getFormatInstructions());

		
			const model = new ChatOpenAI({
				//important ! streaming disables tokenusage
				streaming: true,
				maxConcurrency: 10,
				modelName: req.userEnv.intelligence === 1 ? 'gpt-4-1106-preview' : 'gpt-3.5-turbo',
				frequencyPenalty: validateNumber(req.userEnv.frequence, 0.6),
				presencePenalty: validateNumber(req.userEnv.presence, 0),
				//       temperature: validateNumber(req.userEnv.temperature, 0.3),
				temperature: 0,
// 				stop: ["\nObservation"],
			});
	 
			const executor = await initializeAgentExecutorWithOptions(tools, model, {
				agentType: 'chat-conversational-react-description',
				verbose: true,
				max_iterations:4,
				early_stopping_method:'generate',
				outputParser: ParserWithLang,
				agentArgs: {
					systemMessage: systemPrompt,
				},
				memory: windowMemory,
			});    
			//     testFilter();
			
				response = await executor.call(
					{
						input: question,
// 						 context,
					},
					[handler1]
				);
		}
			//end agent process and begin chat store
			
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
        				await sendSmsResponse(req.userEnv, response, req);
        				
//           const vonage = new Vonage({
//             apiKey: String(req.userEnv.token),
//             apiSecret: String(req.userEnv.secret),
//             			  // apiKey: '8cc49b4e',
// //             			  apiSecret: 'gNoE0Ye8wzZp3ELV'
//           });
//           const to = String(req.body.msisdn);
// //           		  const to = '33610963368';
// //           		  const from = '33644631717';
//           const from = String(req.body.to);
//           const text = response.output;
//           const opts = {
//             type: 'unicode',
//           };
// 
//           function sendSMS() {
//              vonage.sms
//               .send({ to, from, text, ...opts })
//               .then((resp) => {
//                 console.log('Message sent successfully');
//                 console.log(resp);
//               })
//               .catch((err) => {
//                 console.log('There was an error sending the messages.');
//                 console.error(err);
//               });
//           }
// 
//           sendSMS();
        }   

        await deductCredits(req.userEnv.joomId, tokenCounter.total, req.userEnv.intelligence, res);
      } else {
        res.write(
          `data: ${JSON.stringify({
            message: '[ERROR]: Les serveurs sont en maintenance, merci de renouveler la demande plus tard.',
          })}\n\n`
        );
      }

    res.end();
  }
  
);

export default router;
