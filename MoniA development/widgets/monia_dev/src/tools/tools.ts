// External Dependencies
import ivm from 'isolated-vm';

// import dotenv from 'dotenv-flow';
import { Calculator } from 'langchain/tools/calculator';
import { WebBrowser } from 'langchain/tools/webbrowser';
import { DynamicTool } from 'langchain/tools';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { ChainTool } from 'langchain/tools';
import { LLMChain } from 'langchain/chains';
import { VectorDBQAChain } from 'langchain/chains';
// import { loadQAStuffChain } from 'langchain/chains';
// import { RetrievalQAChain } from "langchain/chains";
import { SerpAPI } from 'langchain/tools';
import axios from 'axios';

import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { BaseCallbackHandler } from 'langchain/callbacks';
// import { Serialized } from 'langchain/load/serializable';
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from 'langchain/prompts';
import {
  RunnablePassthrough,
  RunnableSequence,
} from "langchain/schema/runnable";
import { formatDocumentsAsString } from 'langchain/util/document';
import { StringOutputParser } from "langchain/schema/output_parser";

import { getMemoryVectorStore } from '../lib/memoryManager.js';
import { getContextVectorStore } from '../lib/contextManager.js';

export const tokenCounter = { total: 0 };

const safeLangchainMethods = {
	ChainTool: ChainTool,
	VectorDBQAChain: VectorDBQAChain,
//     someMethod: langchain.someMethod,
//     anotherMethod: langchain.anotherMethod,
};

// nouvelle instance Isolate avec une limite de mémoire.
const isolate = new ivm.Isolate({ memoryLimit: 128 });

// Cache pour les contextes par utilisateur
const userContexts = new Map();
console.log('map userContexts ', userContexts);

const proxyFunctions = {
    createDynamicTool: function(args) {
        return new langchain.tools.DynamicTool(args);
    },
    createChatOpenAI: function(args) {
        return new langchain.chat_models.ChatOpenAI(args);
    },
    createChainTool: function(args) {
        return new langchain.tools.ChainTool(args);
    },
    createLLMChain: function(args) {
        return new langchain.chains.LLMChain(args);
    },
    createVectorDBQAChain: function(args) {
        return new langchain.chains.VectorDBQAChain(args);
    }
};

const bootstrapScript = `
    const DynamicTool = ${proxyFunctions.createDynamicTool};
    const ChatOpenAI = ${proxyFunctions.createChatOpenAI};
    const ChainTool = ${proxyFunctions.createChainTool};
    const LLMChain = ${proxyFunctions.createLLMChain};
    const VectorDBQAChain = ${proxyFunctions.createVectorDBQAChain};
`;

const getContextForUser = async (userId) => {
//     if (!userContexts.has(userId)) {
    if(true){
        const context = await isolate.createContext();

        // Exposer la fonction `log` au contexte isolé
//         context.global.set("log", new ivm.Reference(async function (message) {
//             console.log("From isolated:", message);
//         }));

        // Exposer d'autres méthodes au contexte isolé
//         context.global.set('langchain', safeLangchainMethods);
        for (let [key, func] of Object.entries(safeLangchainMethods)) {
						context.global.setSync(key, new ivm.Reference(func));
				}

				await context.eval(bootstrapScript);
				
        userContexts.set(userId, context);
        
        console.log("Isolated context created and configured");
    }
    return userContexts.get(userId);
};


// function testFilter() {
//     // Création de faux documents avec différentes valeurs pour 'isPrivate' et 'actid'
//     const docs = [
//         { metadata: { isPrivate: undefined, actid: undefined } },
//         { metadata: { isPrivate: 2, actid: 11827 } },
//         { metadata: { isPrivate: 4, actid: 0 } },
//         { metadata: { isPrivate: 4 } },
//         { metadata: { isPrivate: 64, actid: 11827 } },
//         { metadata: { isPrivate: 128, actid: 99999 } },
// 		{ metadata: { isPrivate: 128 } },
//         { metadata: { isPrivate: 4096, actid: undefined } },
//         { metadata: { isPrivate: 256 } }, // Document sans metadata actid
//     ];
//
//     // Codes de confidentialité des utilisateurs à tester
//     const user_privacies = [1, 2, 4, 128, 576, 4672, 12864];
//
//     // Les actid à tester
//     const actids = [undefined, 0, 11827];
//
//     // Pour chaque code de confidentialité de l'utilisateur et pour chaque actid, créer un filtre et tester chaque document
//     for (const user_privacy of user_privacies) {
//         console.log(`Testing user_privacy: ${user_privacy}`);
//
//         for (const actid of actids) {
//             console.log(`Testing actid: ${actid}`);
//             const filter = createFilter(user_privacy, false, actid); // supposons que isUserHolder est toujours false pour ces tests
//
//             for (const doc of docs) {
//                 const result = filter(doc);
//                 console.log(`Document with isPrivate ${doc.metadata.isPrivate} and actid ${doc.metadata.actid} is ${result ? '' : 'not '}accessible`);
//             }
//             console.log('----------------');
//         }
//     }
// }

// get today's date
function todayDate(): string {
    const today = new Date();
    return `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear().toString().substr(-2)}`;
}
console.log('date du jour',todayDate());
function escapeSpecialChars(str: string) {
  return str
    .replace(/'/g, "\\'")  // échapper les apostrophes
    .replace(/"/g, '\\"');  // échapper les guillemets
}

function hasAccess(user_privacy: number, doc_isPrivate: number) {
  // Si doc_isPrivate est 0 ou 1, tout le monde a accès
  if (doc_isPrivate <= 1) {
    return true;
  }

  // Si user_privacy est 2 ou plus, l'utilisateur a accès aux documents jusqu'au niveau 1 inclus
  if (user_privacy >= 2) {
    if (doc_isPrivate <= 2) {
      return true;
    }
  }

  // Si user_privacy est 4 ou plus, l'utilisateur a accès aux documents jusqu'au niveau 2 inclus
  if (user_privacy >= 4) {
    if (doc_isPrivate <= 4) {
      return true;
    }
  }

  // Si user_privacy est 64 ou plus, l'utilisateur a accès uniquement aux documents du niveau 64
  if (user_privacy === 64) {
    if (doc_isPrivate === 64) {
      return true;
    }
  }

  // Sinon, vérifiez si tous les bits de doc_isPrivate sont inclus dans user_privacy
  if ((doc_isPrivate & user_privacy) === doc_isPrivate) {
    return true;
  }

  return false;
}

const createFilter = (user_privacy: number, isUserHolder: boolean, actid?: number) => {
  return (doc: any) => {
    const doc_actid = doc.metadata?.actid;
    const doc_isPrivate = doc.metadata?.isPrivate;

    // Si actid est supérieur à 0, alors on filtre d'abord par actid si le metadata actid existe
    if (actid && actid > 0 && doc_actid !== undefined) {
      // Si actid et doc_actid sont différents, le document n'est pas accessible
      if (doc_actid !== actid) {
        return false;
      }
    }

    // Si l'utilisateur est le détenteur du document, il a accès à ce document
    if (isUserHolder) {
      return true;
    }

    // Si le document n'a pas de metadata isPrivate, il est inclus pour tout le monde
    if (typeof doc_isPrivate === 'undefined') {
      return true;
    }

    // Utilisez la fonction personnalisée pour vérifier l'accès
    if (hasAccess(user_privacy, doc_isPrivate)) {
      return true;
    }

    // Pour tous les autres cas, ne renvoie aucun document
    return false;
  };
};

export const initializeTools = async (envTools: any, toolsToInitialize?: string[]) => {
  const { userEnv, intelligence, user_privacy, isUserHolder, actid, msisdn, ownerAtid, userFunction1 } = envTools;

//  	console.log('envTools ', envTools);

	const escapedCompany = escapeSpecialChars(userEnv.company);
	
  const embeddings = new OpenAIEmbeddings();

  const handler2 = BaseCallbackHandler.fromMethods({
    handleLLMEnd(output: LLMResult, _prompts: string[]) {
      try {
        if (typeof output.llmOutput.tokenUsage.totalTokens === 'number') {
          tokenCounter.total += output.llmOutput.tokenUsage.totalTokens;
        } else {
          console.error(
            'output.llmOutput.tokenUsage.totalTokens is not a number:',
            output.llmOutput.tokenUsage.totalTokens
          );
        }
        // 			console.log("Updated tokenCounter.total:", tokenCounter.total);
      } catch (error) {
        console.error('Error in processing llmOutput: ', error);
      }
    },
    handleChainStart(chain) {
      console.log("handleChainStart: I'm the second handler!!", { chain });
    },
    handleAgentAction(action) {
      console.log('handleAgentAction', action);
    },
    handleToolStart(tool) {
      console.log('handleToolStart', { tool });
    },
  });

  const model0 = new ChatOpenAI({
    temperature: 0,
    modelName: intelligence,
    callbacks: [handler2],
  });

  const chatPrompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate('You are a helpful assistant.'),
    HumanMessagePromptTemplate.fromTemplate('{input}'),
  ]);

  let memoryVectorStore;
  try {
    memoryVectorStore = await getMemoryVectorStore(userEnv);
  } catch (error) {
    console.error('Erreur lors de la récupération du memoryVectorStore:', error);
  }

  let contextVectorStore;
  try {
    contextVectorStore = await getContextVectorStore(userEnv);
  } catch (error) {
    console.error('Erreur lors de la récupération du contextVectorStore:', error);
  }
  
  const contextChain = VectorDBQAChain.fromLLM(model0, contextVectorStore);


 // following code fails with chain.run is not a function ! 
// // Initialize a retriever wrapper around the vector store
// const vectorStoreRetriever = contextVectorStore.asRetriever();
// 
// // Create a system & human prompt for the chat model
// const SYSTEM_TEMPLATE = `Use the following pieces of context to answer the question at the end.
// If you don't know the answer, just say that you don't know, don't try to make up an answer.
// ----------------
// {context}`;
// const messages = [
//   SystemMessagePromptTemplate.fromTemplate(SYSTEM_TEMPLATE),
//   HumanMessagePromptTemplate.fromTemplate("{question}"),
// ];
// const prompt = ChatPromptTemplate.fromMessages(messages);
// 
// const contextChain = RunnableSequence.from([
//   {
//     context: vectorStoreRetriever.pipe(formatDocumentsAsString),
//     question: new RunnablePassthrough(),
//   },
//   prompt,
//   model0,
//   new StringOutputParser(),
// ]);  
  

  const memoryChain = VectorDBQAChain.fromLLM(model0, memoryVectorStore);  
  
  const qaTool = new ChainTool({
    name: 'company-qa',
//     description: `Cet outil DOIT être utilisé en premier pour rechercher le contexte, il est aussi utile pour répondre aux questions concernant ` + escapedCompany + ` , ses documents, ses informations et ses produits `,
		description: `Cet outil DOIT toujours être utilisé en premier pour rechercher des éléments de contexte avant d'utiliser un autre outil. Si url existe il faut toujours citer cette url comme source.`,
    chain: contextChain,
		filter: createFilter(user_privacy, isUserHolder), 
// 		returnDirect: true,  
  });

  const chainGK = new LLMChain({
    prompt: chatPrompt,
    llm: model0,
  });

  const memTool = new ChainTool({
    name: 'company-mem',
    description: `pour trouver des réponses en utilisant les réponses archivées dans la mémoire `,
    chain: memoryChain,
		filter: createFilter(user_privacy, isUserHolder, actid),
  });

  const generalKnowledgeTool = new ChainTool({
    name: 'general-qa',
    description: `pour trouver des réponses plus générales aux questions posées lorsque la réponse n'est pas trouvée par les autres outils.`,
    chain: chainGK,
  });

  const serp = new SerpAPI(process.env.SERPAPI_API_KEY, {
    location: 'France',
    hl: 'fr',
    gl: 'fr',
  });
  
  const date = new DynamicTool({
      name: "Today-Date",
      description: "un outil pour trouver la date actuelle",
      func: async () => {
      	return 'la date du jour actuel est le ' + todayDate();
      	}
    });
  
	const registration = new DynamicTool({
		  name: "UserRegistration",
		  description: "A tool for registering users. If you detect that they are not provided in the input or that the email is not a valid email format, you MUST ask for the name and email. Once you have valid email and name, you need to rephrase the input to name: name from the input , email: email from the input.",
		func: async (input, runManager) => {
			console.log('USERINPUT', input);  
			// Extraire les informations de l'input		
			const isStringInput = typeof input === "string";

			const name = isStringInput
					? (input.match(/name:\s*(.+?)\s*(?:, email|$)/) || [])[1]
					: input.name;

			const email = isStringInput
					? (input.match(/email:\s*(.+?)\s*$/) || [])[1]
					: input.email;

			const atid = envTools.ownerAtid;
			const mobile = envTools.msisdn;

			if (!name || !email) {
			  return {
				status: "error",
				message: "Les informations nécessaires sont manquantes."
			  };
			}
			
			// Créer un objet avec ces informations
			const formData = new FormData();
			formData.append('name', name);
			formData.append('email', email);
			formData.append('mobile', mobile);
			formData.append('atid', atid);
	
			console.log('USERDATA', formData);

			// Appeler une URL pour enregistrer ces informations
			try {
			  console.log("Tentative d'appel à l'URL...");
			  const response = await axios.post("https://devel.cercle.business/index.php?option=com_comprofiler&view=pluginclass&plugin=cbautoactions&action=action&actions=342&Itemid=9343&format=raw", formData);
			  const data = response.data;
			  console.log(data);
			if (data.success === 'true') {
				console.log("Utilisateur enregistré avec succès.");
				return "Utilisateur enregistré avec succès. Vous allez recevoir vos informations et mot de passe par email depuis https://cercle.business et vous pouvez continuer à échanger avec moi par sms. ";
			} else {
				console.log("Échec de l'enregistrement de l'utilisateur.");
				//TODO si l'erreur est email déjà enregistré, il faut mettre à jour le champs cb_mobile directement.
				return "Erreur : Échec de l'enregistrement de l'utilisateur. Si votre email est déjà enregistré, il vous faut mettre à jour votre numéro de téléphone mobile sur le site https://cercle.business pour pouvoir continuer à discuter avec moi.";
			}
			} catch (error) {
			  console.error("Erreur lors de l'appel à l'URL:", error);
			  if (error.response && error.response.status === 503) {
						return "Ce serveur est temporairement indisponible ou hors ligne. Veuillez réessayer votre enregistrement plus tard.";
				}
			  return "Échec de l'enregistrement de l'utilisateur. Il y a un problème de connexion depuis ce sms. Enregistrez vous gratuitement avec votre numéro de téléphone sur https://cercle.business/inscription";
		}  
	}
	});
 
const companytool1 = new DynamicTool({
    name: "CompanyTool1",
// 		  description: `cet outil peut être utilisé pour trouver des réponses pour : `,    
    description: `Cet outil DOIT être utilisé en premier pour rechercher le contexte, il est aussi utile pour répondre aux questions concernant ${escapedCompany}, ses documents, ses informations et ses produits. `,
    func: async (input, runManager) => {
        const userId = userEnv.joomId;
        console.log('userid: ', userId);
        const userScript = envTools.userFunction1;
        console.log('fonction 1: ', userScript);
//test script utilisateur entreprise:         
//          (async () => { return await langchain.VectorDBQAChain.fromLLM(model0, contextVectorStore);})();

// function execute() {
//     log("Hello from isolated context using exposed function!");
// }
// execute();
        const isolated = await getContextForUser(userId);
        console.log('isolated:', isolated);

        try {
            const script = await isolate.compileScript(userScript);
            const completion = await script.run(isolated);
            console.log('completion result',completion.result);
            return completion.result;
            
						//returnDirect: false, // This is an option that allows the tool to return the output directly, to insert in the usercode

            console.log('script résultat : ', completion.result);

        } catch (err) {
					console.error(err);
					return `Error executing user code: ${err.message}`;        }
    }
});

  //TODO : rajouter code zapier avec oauth et code ouvert pour les développeurs en fonction des besoins des clients
  //check if le champs existe sur cb et affiche le tool si oui pour utilisation par monia
  //rajouter aussi outil mysql
  //lier avec langchain pour créer des modules en donnant accès via isolate-vm

  const allTools = [
//     ...(userEnv.plan == 1 ? [companytool1] : []),
    qaTool,
    memTool,
    serp,
    registration,
		date,
    new Calculator(),
    new WebBrowser({ model: model0, embeddings: embeddings }),
		generalKnowledgeTool,
  ];
    // Si toolsToInitialize est spécifié, filtrez la liste pour inclure uniquement ces outils
    if (toolsToInitialize && toolsToInitialize.length > 0) {
        return allTools.filter(tool => toolsToInitialize.includes(tool.name));
    }

    // Sinon, retournez tous les outils
    return allTools;  
};
