import { Router } from 'express';
import { finished } from 'stream';
import { getConfig } from '../config/index.js';
import { logChat, logOwnChat, getLogFilename } from '../chatLogger.js';
import { getMemoryVectorStore, addDocumentsToMemoryVectorStore, getBufferWindowMemory } from '../lib/memoryManager.js';
import { getRelevantContext } from '../lib/vectorStoreUtils.js';
import sanitizeInput from '../utils/sanitizeInput.js';
import { getContextVectorStore } from '../lib/contextManager.js';
import { deductCredits, validateNumber } from '../utils/credits.js';
import express from 'express';
import { CustomRequest } from '../models/UserEnvironment.js';

import { ConversationChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';
// import { CallbackManager } from 'langchain/callbacks';
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from 'langchain/prompts';
import { HumanChatMessage, AIChatMessage } from 'langchain/schema';
// import { Calculator } from "langchain/tools/calculator";
// import { LLMChain } from 'langchain/chains';
import { oneLine } from 'common-tags';

const router = Router();

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
// Créez une Map pour stocker les instances de BufferWindowMemory pour chaque actid.
const bufferWindowMemoryMap = new Map();

router.post(
  '/',
  sseMiddleware,
  (_req: CustomRequest, _res: express.Response, next: express.NextFunction) => {
    next();
  },
  async (req: CustomRequest, res: express.Response) => {
    console.log('Received request:', req.body);
    // check if token is valid
    if (!req.userEnv) {
      res.status(401).send({ message: 'Invalid token' });
      return;
    }
    const model = new ChatOpenAI({
      streaming: true,
      //       callbackManager,
      maxConcurrency: 10,
      modelName: req.userEnv.intelligence === 1 ? 'gpt-4' : 'gpt-3.5-turbo-1106',
      frequencyPenalty: validateNumber(req.userEnv.frequence, 0.6),
      presencePenalty: validateNumber(req.userEnv.presence, 0),
      temperature: validateNumber(req.userEnv.temperature, 0),
      maxTokens: 500,
    });

    //     const tools = [
    //     	new Calculator
    //     ];

    if (!req.body || !req.body.prompt) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Le champ "prompt" est obligatoire' })}\n\n`);
      res.end();
      return;
    }
    //     console.log('credits : ', req.userEnv.credits);
    if (req.userEnv.credits < 1) {
      res.write(`data: ${JSON.stringify({ token: "Je ne peux plus vous répondre, vous devriez demandez au propriétaire de ce site de <a href='https://cercle.business/recharge-de-credits'>recharger ses crédits disponibles</a> pour de nouvelles réponses." })}\n\n`);
      res.write(`data: ${JSON.stringify({ message: '[DONE]' })}\n\n`);
      return;
    }
    //   const userid = req.body.user;
    const actid = req.body.actid;
    const user_privacy = req.body.actid_perms || 1; //default public user
    const isUserHolder = req.userEnv.joomId === actid;
    //   const base = req.body.base;
    const question = sanitizeInput(req.body.prompt);
    const data_website = req.body.data_website;
//     const chat_file = req.body.chat_file;
    //   const last_questions = req.body.last_questions;
    //   const last_answers = req.body.last_answers;
    const config = getConfig();
    let memoryVectorStore;
    try {
      memoryVectorStore = await getMemoryVectorStore(req.userEnv);
      // 	console.log('Loaded memoryVectorStore:', memoryVectorStore);
    } catch (error) {
      // 	console.error('Error loading memoryVectorStore:', error);
      res.write(
        `event: error\ndata: ${JSON.stringify({ message: 'Erreur lors du chargement de memoryVectorStore' })}\n\n`
      );
      res.end();
      return;
    }
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

    const chatLogDirectory = req.userEnv.chatLogDirectory;
    const chatLogActidDirectory = `chat_logs/` + actid;

    const systemPromptTemplate = req.userEnv.systemPromptTemplate;
    const systemPrompt = SystemMessagePromptTemplate.fromTemplate(oneLine`
	  ${systemPromptTemplate}
	`);
    //     console.log(systemPrompt);
    const chatPrompt = ChatPromptTemplate.fromPromptMessages([
      systemPrompt,
      //       new MessagesPlaceholder("history"),
      HumanMessagePromptTemplate.fromTemplate('QUESTION: """{input}"""'),
    ]);

    let windowMemory = bufferWindowMemoryMap.get(actid);
    if (!windowMemory) {
      windowMemory = getBufferWindowMemory(req.userEnv);
      bufferWindowMemoryMap.set(actid, windowMemory);
    }
    //     console.log('immediate_memory : ', windowMemory);

    //     const chain = new LLMChain({
    const chain = new ConversationChain({
      memory: windowMemory,
      prompt: chatPrompt,
      llm: model,
    });

    let context, history;
    try {
      context = await getRelevantContext(
        contextVectorStore,
        question,
        config.numContextDocumentsToRetrieve,
        user_privacy,
        isUserHolder
      );
      //       console.log('Retrieved context:', context);
    } catch (error) {
      console.error('Error retrieving context:', error);
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Erreur lors de la récupération du contexte' })}\n\n`);
      res.end();
      return;
    }
    try {
      history = await getRelevantContext(
        memoryVectorStore,
        question,
        config.numMemoryDocumentsToRetrieve,
        user_privacy,
        isUserHolder,
        actid
      );
      //       console.log('Retrieved history:', history);
    } catch (error) {
      console.error('Error retrieving history:', error);
      res.write(
        `event: error\ndata: ${JSON.stringify({
          message: 'Erreur lors de la récupération de la mémoire historique',
        })}\n\n`
      );
      res.end();
      return;
    }

    let response;
    //     testFilter();

    try {
      response = await chain.call(
        {
          input: question,
          context,
          history,
          timeout: 60000,
          //           immediate_history: windowMemory,
          // 		immediate_history: config.useWindowMemory ? windowMemory : '',
        },
        [
          {
            handleLLMNewToken(token: string) {
              res.write(`data: ${JSON.stringify({ token })}\n\n`);
            },
          },
        ]
      );

      // const ctHistory = windowMemory.chatHistory;
      // const memory_messages = ctHistory.messages;
      // memory_messages.forEach((messageObject) => {
      //   const messageText = messageObject.content || messageObject.text;
      //   console.log('messages CT', messageText);
      // });
      // 		console.log('reponse :', response);
      // 		console.log ('ct ', windowMemory.chatHistory.messages);

      if (response) {
        const filename = await getLogFilename(String(actid));

        await addDocumentsToMemoryVectorStore(req.userEnv, memoryVectorStore, [
          { content: question, metadataType: 'question', filename: filename, isPrivate: user_privacy, actid: actid },
          {
            content: response.response,
            metadataType: 'answer',
            filename: filename,
            isPrivate: user_privacy,
            actid: actid,
          },
        ]);

        const humanMessages = windowMemory.chatHistory.messages
          .filter((message: HumanChatMessage) => message instanceof HumanChatMessage)
          .map((message: HumanChatMessage) => message.text);
        const aiMessages = windowMemory.chatHistory.messages
          .filter((message: AIChatMessage) => message instanceof AIChatMessage)
          .map((message: AIChatMessage) => message.text);

        let tokHuHistory = 0;
        for (let message of humanMessages) {
          tokHuHistory += await model.getNumTokens(message);
        }

        let tokAIHistory = 0;
        for (let message of aiMessages) {
          tokAIHistory += await model.getNumTokens(message);
        }

        const tokQuestion = await model.getNumTokens(question);
        const tokContext = await model.getNumTokens(context);
        const tokHistory = await model.getNumTokens(history);
        const tokResponse = await model.getNumTokens(response.response);
//         const totalTokenCount = tokQuestion + tokContext + tokHistory + tokHuHistory + tokAIHistory + tokResponse;
				const totalTokenCount = tokQuestion + tokContext + tokHistory + tokResponse;
        console.log('tokens utilisés : ', totalTokenCount);

        //log chat for owner
        await logChat(chatLogDirectory, String(actid), question, response.response, data_website);
        //also log chat for user
//         console.log('chat directory userid ', chatLogDirectory);
//         console.log('chat directory actid ', chatLogActidDirectory);
        await logOwnChat(chatLogActidDirectory, String(req.userEnv.joomId), question, response.response, data_website);
        res.write(`data: ${JSON.stringify({ message: '[DONE]', totalTokenCount })}\n\n`);
        await deductCredits(req.userEnv.joomId, totalTokenCount, req.userEnv.intelligence, res);
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
