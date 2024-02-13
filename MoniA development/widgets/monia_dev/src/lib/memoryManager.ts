import chalk from 'chalk';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import hnswnode from 'hnswlib-node';
import fs from 'fs/promises';
import path from 'path';
import { stdout as output } from 'node:process';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { Document } from 'langchain/document';
// import { BufferWindowMemory } from 'langchain/memory';
import { CombinedMemory, BufferWindowMemory, ConversationSummaryBufferMemory } from 'langchain/memory';
import { getDefaultOraOptions, getProjectRoot } from '../config/index.js';
import { UserEnvironment } from '../models/UserEnvironment.js';
import { promises as fsPromises } from 'fs';
import ora from 'ora';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const projectRootDir = getProjectRoot();

function validateUserEnv(userEnv: UserEnvironment) {
  if (!userEnv.memoryVectorStoreDir) {
    throw new Error('The memoryVectorStoreDir is not defined in the user environment. Please check your settings.');
  }
}

function memDirectory(userEnv: UserEnvironment) {
  return userEnv.memoryVectorStoreDir;
}

async function getMemoryVectorStore(userEnv: UserEnvironment) {
  validateUserEnv(userEnv);
  const memoryDirectory = path.join(projectRootDir, userEnv.memoryVectorStoreDir);
  let memoryVectorStore: HNSWLib;
  try {
    memoryVectorStore = await HNSWLib.load(memoryDirectory, new OpenAIEmbeddings());
  } catch {
    output.write(`${chalk.blue(`Creating a new memory vector store index in the ${memoryDirectory} directory`)}\n`);
    memoryVectorStore = new HNSWLib(new OpenAIEmbeddings(), {
      space: 'cosine',
      numDimensions: 1536,
    });
  }

  return memoryVectorStore;
}

function getBufferWindowMemory(userEnv: UserEnvironment) {
  validateUserEnv(userEnv);
  const bufferWindowMemory = new BufferWindowMemory({
    returnMessages: true,
    memoryKey: 'chat_history',
    inputKey: 'input',
    k: 4,
  });

  return bufferWindowMemory;
}

// function getBufferWindowMemory(userEnv: UserEnvironment) {
//   validateUserEnv(userEnv);
//   const bufferWindowMemory = new ConversationSummaryBufferMemory({
//     llm: new ChatOpenAI({ modelName: 'gpt-3.5-turbo', temperature: 0 }),
//     returnMessages: true,
//     maxTokenLimit: 10,
//     memoryKey: 'chat_history',
//     inputKey: 'input',
//   });
// 
//   return bufferWindowMemory;
// }

// function getBufferWindowMemory(userEnv: UserEnvironment) {
//   validateUserEnv(userEnv);
//   const bufferMemory = new BufferWindowMemory({
//     returnMessages: true,
//     memoryKey: 'chat_history',
//     inputKey: 'input',
//     k: 2,
//   });
//   const summaryMemory = new ConversationSummaryBufferMemory({
//     llm: new ChatOpenAI({ modelName: 'gpt-3.5-turbo', temperature: 0 }),
//     returnMessages: true,
//     maxTokenLimit: 10,
//     memoryKey: 'chat_history',
//     inputKey: 'input',
//   });  
//     
//   const bufferWindowMemory = new CombinedMemory({
// 		memories: [bufferMemory, summaryMemory],
// 	});
// 
// 
//   return bufferWindowMemory;
// }

async function getDocIDsByFilename(docStorePath: string, filename: string) {
  const docIDs = [];
  try {
    //     console.log(`Reading file at path: ${docStorePath}`);
    const data = await fsPromises.readFile(docStorePath, 'utf8');
    //     console.log(`File read successful. Parsing JSON...`);
    const docStore = JSON.parse(data);
    //     console.log(`JSON parsing successful. Iterating over document store...`);

    const basename = path.basename(filename);

    //     console.log('All entries in the docstore:');
    for (let entry of docStore) {
      const id = entry[0];
      const doc = entry[1];
      //       console.log(`ID: ${id}, Filename: ${doc.metadata && doc.metadata.filename}`);
      if (doc.metadata && doc.metadata.filename === basename) {
        docIDs.push(id);
        //         console.log(`Matched filename. Added document ID ${id} to the array.`);
      }
    }
  } catch (error) {
    console.error(`Failed to read or parse file at path: ${docStorePath}`);
    console.error(error);
  }

  return docIDs;
}

async function loadIndex(directory: string) {
  const index = new hnswnode.HierarchicalNSW('cosine', 1536);

  try {
    index.initIndex(1536);
    await index.readIndex(`${directory}/hnswlib.index`, true);
    return index;
  } catch (error) {
    console.error(`Erreur lors de la lecture de l'index : ${error}`);
    throw error;
  }
}

async function deleteFromDocStore(docStorePath: string, docIDs: string[]) {
  const fs = require('fs').promises;
  let docStore;

  try {
    const rawData = await fs.readFile(docStorePath);
    docStore = JSON.parse(rawData);

    // For each document, if the document ID is in the list of IDs to delete, then clear the document content.
    for (let doc of docStore) {
      const [id, content] = doc;
      if (docIDs.includes(id)) {
        content.pageContent = '';
        content.metadata = {};
      }
    }

    await fs.writeFile(docStorePath, JSON.stringify(docStore, null, 2));
  } catch (error) {
    console.error(`Error during deletion from docstore: ${error}`);
    throw error;
  }
}

async function deleteConversation(userEnv: UserEnvironment, userdata: any) {
  let spinner;

  try {
    spinner = ora({
      ...getDefaultOraOptions,
      text: `Deleting conversation from the Memory Vector Store `,
    }).start();

    const filenames = userdata.docs.map((docPath: string) => {
      return path.basename(docPath);
    });

    //     console.log(`Processing files with filenames: ${filenames}`);

    // Load docstore.json and retrieve ids with filename
    const docStorePath = path.join(userEnv.memoryVectorStoreDir, 'docstore.json');
    let docIDs: string[] = [];
    for (let filename of filenames) {
      //       console.log(`Getting document IDs for filename: ${filename}`);
      const ids = await getDocIDsByFilename(docStorePath, filename);
      //       console.log(`Retrieved IDs: ${ids}`);
      docIDs = docIDs.concat(ids);
    }

    //     console.log(`Total document IDs retrieved: ${docIDs}`);

    // Load the memory store from the same directory
    const indexDb = await loadIndex(memDirectory(userEnv));

    //     console.log(`Found ${docIDs.length} documents`);

    // Delete the corresponding documents from the index with markDelete from hnswlib-node and delete for docstore
    for (const docID of docIDs) {
      //       console.log(`Deleting document with ID: ${docID}`);
      indexDb.markDelete(Number(docID));
      //       console.log(`Document with ID: ${docID} marked for deletion.`);
    }

    // Delete the documents from docstore.json
    //     console.log(`Deleting documents from docstore...`);
    await deleteFromDocStore(docStorePath, docIDs);
    //     console.log(`Documents deleted from docstore.`);

    //     console.log(`Saving changes to vector store...`);
    await indexDb.writeIndex(path.join(memDirectory(userEnv), 'hnswlib.index'));
    //     console.log(`Changes saved successfully.`);

    spinner.succeed();
  } catch (error) {
    if (spinner) {
      spinner.fail(chalk.red(error));
    } else {
      output.write(chalk.red(error));
    }
  }
}

async function saveMemoryVectorStore(userEnv: UserEnvironment, memoryVectorStore: HNSWLib) {
  validateUserEnv(userEnv);
  const memoryDirectory = path.join(projectRootDir, userEnv.memoryVectorStoreDir);
  await fs.mkdir(memoryDirectory, { recursive: true });
  await memoryVectorStore.save(memoryDirectory);
}

async function addDocumentsToMemoryVectorStore(
  userEnv: UserEnvironment,
  memoryVectorStore: HNSWLib,
  documents: Array<{ content: string; metadataType: string; filename: string; isPrivate: string; actid: string }>
): Promise<void> {
  const formattedDocuments = documents.map(
    (doc) =>
      new Document({
        pageContent: doc.content,
        metadata: { type: doc.metadataType, filename: doc.filename, isPrivate: doc.isPrivate, actid: doc.actid },
      })
  );
  await memoryVectorStore.addDocuments(formattedDocuments);
  await saveMemoryVectorStore(userEnv, memoryVectorStore);
}

function resetBufferWindowMemory(userEnv: UserEnvironment) {
  const bufferWindowMemory = getBufferWindowMemory(userEnv);
  bufferWindowMemory.clear();
}

async function deleteMemoryDirectory(userEnv: UserEnvironment) {
  validateUserEnv(userEnv);
  const memoryDirectory = path.join(projectRootDir, userEnv.memoryVectorStoreDir);
  try {
    const files = await fs.readdir(memoryDirectory);
    const deletePromises = files.map((file) => fs.unlink(path.join(memoryDirectory, file)));
    await Promise.all(deletePromises);
    return `All files in the memory directory have been deleted.`;
  } catch (error) {
    if (error instanceof Error) {
      return chalk.red(`All files in the memory directory have been deleted: ${error.message}`);
    }
    return chalk.red(`All files in the memory directory have been deleted: ${error}`);
  }
}

async function resetMemoryVectorStore(userEnv: UserEnvironment) {
  const newMemoryVectorStore = new HNSWLib(new OpenAIEmbeddings(), {
    space: 'cosine',
    numDimensions: 1536,
  });
  await deleteMemoryDirectory(userEnv);
  return newMemoryVectorStore; // retourne la nouvelle instance
}

function setMemoryVectorStore(newMemoryVectorStore: HNSWLib) {
  return newMemoryVectorStore;
}

export {
  getMemoryVectorStore,
  setMemoryVectorStore,
  addDocumentsToMemoryVectorStore,
  deleteConversation,
  resetMemoryVectorStore,
  getBufferWindowMemory,
  resetBufferWindowMemory,
};
