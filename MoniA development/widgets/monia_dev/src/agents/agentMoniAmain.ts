import JSON5 from 'json5';

import { getMemoryVectorStore, addDocumentsToMemoryVectorStore, getBufferWindowMemory } from '../lib/memoryManager.js';
import { tokenCounter, initializeTools } from '../tools/tools.js';
import { deductCredits, validateNumber } from '../utils/credits.js';
// Types
import { CustomRequest } from '../models/UserEnvironment.js';

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
} from 'langchain/prompts';

const bufferWindowMemoryMap = new Map();

let response;

export const handleMainMoniaAgent = async (question: string, envTools: any, req: any, res:any) => {  

    let windowMemory = bufferWindowMemoryMap.get(envTools.actid);
    if (!windowMemory) {
      windowMemory = getBufferWindowMemory(req.userEnv);
      bufferWindowMemoryMap.set(envTools.actid, windowMemory);
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
// 		const instructionsWithLang = formatInstructions + '\n Remember that you MUST translate the Final Answer in the ' + language + ' envTools.lang.\n';

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

// 		console.log('newformatinstructions', ParserWithLang.getFormatInstructions());

		
    const model = new ChatOpenAI({
      //important ! streaming disables tokenusage
      streaming: true,
      maxConcurrency: 10,
      modelName: req.userEnv.intelligence === 1 ? 'gpt-4-1106-preview' : 'gpt-3.5-turbo',
      frequencyPenalty: validateNumber(req.userEnv.frequence, 0.6),
      presencePenalty: validateNumber(req.userEnv.presence, 0),
      //       temperature: validateNumber(req.userEnv.temperature, 0.3),
      temperature: 0,
    });
   
	

    const executor = await initializeAgentExecutorWithOptions(tools, model, {
      agentType: 'chat-conversational-react-description',
      verbose: true,
      max_iterations:4,
      early_stopping_method:'generate',
      outputParser: ParserWithLang,
      agentArgs: {
        systemMessage: envTools.agentPrompt,
      },
      memory: windowMemory,
//       stop: ["\nObservation", "Final Answer"],
    });    

    //     testFilter();
			

    response = await executor.call(
        {
          input: question,
        },
        [handler1]
      );

		return response;
}