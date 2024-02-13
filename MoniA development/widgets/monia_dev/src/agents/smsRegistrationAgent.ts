import { Vonage } from '@vonage/server-sdk';

import {
  LLMSingleActionAgent,
  AgentActionOutputParser,
  AgentExecutor,
  initializeAgentExecutorWithOptions,
} from "langchain/agents";

import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from 'langchain/chat_models/openai';
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  PromptTemplate,
} from 'langchain/prompts';
import {
  InputValues,
  PartialValues,
  AgentStep,
  AgentAction,
  AgentFinish,
} from "langchain/schema";

import { initializeTools } from '../tools/tools.js';

// Un objet pour suivre le nombre de questions pour chaque utilisateur avec actid = 0
const counterForZeroActid: { [msisdn: string]: number } = {};
    
export const handleSmsAgent = async (question: string, envTools: any, req: any) => {  
	const msisdn = envTools.msisdn;

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

    // Si actorid = 0 et counterForZeroActid < 4, continuez l'exécution du code
//     if (req.body.actid === 0 && counterForZeroActid[msisdn] < 4) {
        // Ici, ajoutez le code que vous voulez exécuter lorsque counterForZeroActid < 4
//     }
    // Sinon, vérifiez si l'utilisateur a atteint la limite de 4 questions      
     if (counterForZeroActid[msisdn] > 30 || req.body.msisdn == '33610963368') {
// 				      if (true) {
				      
// 						const smschat = new ChatOpenAI({ modelName: "gpt-4", temperature: 0 });
						const smschat = new ChatOpenAI({modelName:'gpt-4-0613', temperature: 0})
			
						const input = "You need to register me " + question;
												
						const tools = await initializeTools(envTools, ["UserRegistration"]);
// 						console.log('smstools', tools);											
// 

						const smsPrompt = `You are a helpful assistant which will register me on the website cercle.business. When answering remember that you MUST respond in the following language with short tag: ` + req.body.lang + ` .`;

						const smsexecutor = await initializeAgentExecutorWithOptions(tools, smschat, {
// 							agentType: "openai-functions",
								agentType: "zero-shot-react-description",
// 								agentType: "chat-conversational-react-description",
							verbose: true,
							agentArgs: {
// 									prefix: smsPrompt,
									systemMessage : smsPrompt,
							},
						}); 					
								
						let response
						response = await smsexecutor.call(
							{
								input: input,
							});		  
						return response;
}									
}					
						//send sms response
export const sendSmsResponse = async (userEnv: any, response: any, req: any) => {						
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