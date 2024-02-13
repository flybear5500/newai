import chalk from 'chalk';
import { stdout as output } from 'node:process';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import hnswnode from 'hnswlib-node';
import { JSONLoader } from 'langchain/document_loaders/fs/json';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { DocxLoader } from 'langchain/document_loaders/fs/docx';
import { EPubLoader } from 'langchain/document_loaders/fs/epub';
import { CSVLoader } from 'langchain/document_loaders/fs/csv';
import ora from 'ora';
import { MarkdownTextSplitter, RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';

import * as path from 'path';
// import path from 'path';
import { YoutubeTranscript } from 'youtube-transcript';
import { getDefaultOraOptions, getProjectRoot } from '../config/index.js';
import getDirectoryFiles from '../utils/getDirectoryFiles.js';
import WebCrawler from './crawler.js';
import { promises as fsPromises } from 'fs';
// import { chain } from 'stream-chain';
// import { parser } from 'stream-json';
// import { streamArray } from 'stream-json/streamers/StreamArray';

import { createRequire } from 'module';
import { UserEnvironment } from '../models/UserEnvironment.js';

const require = createRequire(import.meta.url); // construct a require function
// const { chain } = require('stream-chain');
// const { parser } = require('stream-json');
// const { streamArray } = require('stream-json/streamers/StreamArray.js');

const projectRootDir = getProjectRoot();

function dbDirectory(userEnv: UserEnvironment) {
  return userEnv.vectorStoreBaseDir;
}

//todo see why streaming provoke 504 gateway errors
// async function getDocIDsByFilename(docStorePath, filename) {
//   const docIDs = [];
//
//   const pipeline = chain([
//     fs.createReadStream(docStorePath),
//     parser(),
//     streamArray(),
//     data => {
//       const doc = data.value;
//       if (doc[1] && doc[1].metadata && doc[1].metadata.filename === filename) {
//         docIDs.push(doc[0]);
//       }
//       return null;
//     }
//   ]);
//
//   return new Promise((resolve, reject) => {
//     pipeline.on('end', () => resolve(docIDs));
//     pipeline.on('error', reject);
//   });
// }

//without streaming, ok for small files
async function getDocIDsByFilename(docStorePath: string, filename: string) {
  const docIDs = [];
  try {
    //     console.log(`Reading file at path: ${docStorePath}`);
    const data = await fsPromises.readFile(docStorePath, 'utf8');
    //     console.log(`File read successful. Parsing JSON...`);
    const docStore = JSON.parse(data);
    //     console.log(`JSON parsing successful. Iterating over document store...`);

    // Determine whether the given filename is a URL or a local file path
    const isURL = filename.startsWith('http://') || filename.startsWith('https://');
    const basename = isURL ? filename : path.basename(filename);

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

// async function loadIndex(directory: string) Promise<HierarchicalNSW>  {
//    const index = new hnswnode.HierarchicalNSW('cosine', 1536);
//
//   try {
//   index.initIndex(100);
//     await index.readIndex(`${directory}/hnswlib.index`);
//     return index;
//   } catch (error) {
//     console.error(`Erreur lors de la lecture de l'index : ${error}`);
//     throw error;
//   }
// }

// console.log(Object.keys(hnswnode));

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

//cette version supprime les documents mais le probleme vient ensuite de hnswlib qui les conserve
//donc le numéro suivant est faux
// async function deleteFromDocStore(docStorePath, docIDs) {
//     const fs = require('fs').promises;
//     let docStore;
//
//     try {
//         const rawData = await fs.readFile(docStorePath);
//         docStore = JSON.parse(rawData);
//
//         // Filter out the documents to be deleted
//         docStore = docStore.filter(doc => {
//             const [id, ] = doc;
//             return !docIDs.includes(id);
//         });
//
//         await fs.writeFile(docStorePath, JSON.stringify(docStore, null, 2));
//
//     } catch (error) {
//         console.error(`Error during deletion from docstore: ${error}`);
//         throw error;
//     }
// }

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

async function deleteDocument(userEnv: UserEnvironment, userdata: any) {
  // Remplacez 'any' par le type approprié si vous le connaissez
  let spinner;

  try {
    spinner = ora({
      ...getDefaultOraOptions,
      text: `Deleting document from the Context Vector Store `,
    }).start();

    const filenames = userdata.docs.map((docPath: string) => {
      if (docPath.startsWith('http://') || docPath.startsWith('https://')) {
        // docPath appears to be a URL, don't use path.basename
        return docPath;
      } else {
        // docPath is a local file path, use path.basename
        return path.basename(docPath);
      }
    });

    //     console.log(`Processing files with filenames: ${filenames}`);

    // Load docstore.json and retrieve ids with filename
    const docStorePath = path.join(userEnv.vectorStoreBaseDir, 'docstore.json');
    let docIDs: string[] = [];
    for (let filename of filenames) {
      //       console.log(`Getting document IDs for filename: ${filename}`);
      const ids = await getDocIDsByFilename(docStorePath, filename);
      //       console.log(`Retrieved IDs: ${ids}`);
      docIDs = docIDs.concat(ids);
    }

    //     console.log(`Total document IDs retrieved: ${docIDs}`);

    // Load the vector store from the same directory
    //     console.log(`Loading vector store...`);
    //     const loadedVectorStore = await HNSWLib.load(dbDirectory(userEnv), new OpenAIEmbeddings({ maxConcurrency: 5 }));

    const indexDb = await loadIndex(dbDirectory(userEnv));

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
    await indexDb.writeIndex(path.join(dbDirectory(userEnv), 'hnswlib.index'));
    // await loadedVectorStore.save(dbDirectory(userEnv));

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

/**
 * This function loads and splits a file based on its extension using different loaders and text
 * splitters.
 * @param {string} filePath - A string representing the path to the file that needs to be loaded and
 * split into documents.
 * @returns The function `loadAndSplitFile` returns a Promise that resolves to an array of `Document`
 * objects, where each `Document` represents a split portion of the input file. The type of the
 * `Document` object is `Document<Record<string, unknown>>`, which means it has a generic type
 * parameter that is an object with string keys and unknown values.
 */
async function loadAndSplitFile(filePath: string): Promise<Document<Record<string, unknown>>[]> {
  const fileExtension = path.extname(filePath);
  let loader;
  let documents: Document<Record<string, unknown>>[];
  switch (fileExtension) {
    case '.json':
      loader = new JSONLoader(filePath);
      documents = await loader.loadAndSplit(new RecursiveCharacterTextSplitter());
      break;
    case '.txt':
      loader = new TextLoader(filePath);
      documents = await loader.loadAndSplit(new RecursiveCharacterTextSplitter());
      break;
    case '.md':
      loader = new TextLoader(filePath);
      documents = await loader.loadAndSplit(new MarkdownTextSplitter());
      break;
    case '.pdf':
      loader = new PDFLoader(filePath, { splitPages: false });
      documents = await loader.loadAndSplit(new RecursiveCharacterTextSplitter());
      break;
    case '.docx':
      loader = new DocxLoader(filePath);
      documents = await loader.loadAndSplit(new RecursiveCharacterTextSplitter());
      break;
    case '.csv':
      loader = new CSVLoader(filePath);
//       documents = await loader.loadAndSplit(new RecursiveCharacterTextSplitter());
			documents = await loader.load();
      break;
    case '.epub':
      loader = new EPubLoader(filePath, { splitChapters: false });
      documents = await loader.loadAndSplit(new RecursiveCharacterTextSplitter());
      break;
    default:
      throw new Error(`Unsupported file extension: ${fileExtension}`);
  }
  return documents;
}

/**
 * This function loads or creates a vector store using HNSWLib and OpenAIEmbeddings.
 * @returns The function `loadOrCreateVectorStore` returns a Promise that resolves to an instance of
 * the `HNSWLib` class, which is a vector store used for storing and searching high-dimensional
 * vectors.
 */
async function loadOrCreateVectorStore(userEnv: UserEnvironment): Promise<HNSWLib> {
  let vectorStore: HNSWLib;
  let spinner;
  const directory = dbDirectory(userEnv);

  try {
    vectorStore = await HNSWLib.load(directory, new OpenAIEmbeddings({ maxConcurrency: 5 }));
  } catch {
    spinner = ora({
      ...getDefaultOraOptions,
      text: chalk.blue(`Creating new Context Vector Store in the ${directory} directory`),
    }).start();

    const docsDirectory = path.join(projectRootDir, userEnv.docsStoreDir || 'docs');
    const filesToAdd = await getDirectoryFiles(docsDirectory);

    if (filesToAdd.length === 0) {
      const text = `Bonjour, Je suis MoniA, l'intelligence artificielle de ${userEnv.company} sur son site ${userEnv.website}`;
      const metadata = { userid: userEnv.joomId };
      vectorStore = await HNSWLib.fromTexts([text], [metadata], new OpenAIEmbeddings({ maxConcurrency: 5 }));
    } else {
      const documents = await Promise.all(filesToAdd.map((filePath) => loadAndSplitFile(filePath)));
      const flattenedDocuments = documents.reduce((acc, val) => acc.concat(val), []);
      vectorStore = await HNSWLib.fromDocuments(flattenedDocuments, new OpenAIEmbeddings({ maxConcurrency: 5 }));
    }

    await vectorStore.save(directory);
    spinner.succeed();
  }

  return vectorStore;
}

async function loadContextVectorStore(userEnv: UserEnvironment) {
  return loadOrCreateVectorStore(userEnv);
}

const contextWrapper = {
  contextInstance: loadContextVectorStore,
};

async function getContextVectorStore(userEnv: UserEnvironment) {
  return await contextWrapper.contextInstance(userEnv);
}

/**
 * This function adds documents to a context vector store and saves them.
 * @param {string[]} filePaths - The `filePaths` parameter is an array of strings representing the file
 * paths of the documents that need to be added to the Context Vector Store.
 * @returns nothing (`undefined`).
 */
async function addDocument(userEnv: UserEnvironment, userdata: { userid: string; docs: string[]; isPrivate: number }) {
  let spinner;

  // Check if userdata is defined and that userdata.docs is an array
  if (!userdata || !Array.isArray(userdata.docs)) {
    throw new Error('userdata is not defined or userdata.docs is not an array');
  }

  spinner = ora({ ...getDefaultOraOptions, text: `Adding files to the Context Vector Store` }).start();

  try {
    const documents = await Promise.all(
      userdata.docs.map(async (filePath) => {
        // Check if filePath is not null and is a string
        if (typeof filePath !== 'string') {
          throw new Error(`Invalid file path: ${filePath}`);
        }

        //         console.log(`Loading file from path: ${filePath}`);

        try {
          // Use try/catch here to handle any errors during file loading and splitting
          const loadedDocuments = await loadAndSplitFile(filePath);

          // Adding metadata to each document
          loadedDocuments.forEach((doc) => {
            doc.metadata = {
              userid: userdata.userid,
              filename: path.basename(filePath),
              extension: path.extname(filePath),
              dateAdded: new Date().toISOString(),
              isPrivate: userdata.isPrivate,
            };
          });

          return loadedDocuments;
        } catch (err) {
          console.error(`Failed to load and split file at path: ${filePath}`);
          console.error(err);
          // Skip this file by returning an empty array
          return [];
        }
      })
    );

    const flattenedDocuments = documents.reduce((acc, val) => acc.concat(val), []);
    const vectorStore = await getContextVectorStore(userEnv);
    await vectorStore.addDocuments(flattenedDocuments);
    await vectorStore.save(dbDirectory(userEnv));
    spinner.succeed();
  } catch (error) {
    console.error(error);
    spinner.fail();
  }
}

async function addTextAsDocument(
  userEnv: UserEnvironment,
  userdata: { userId: string; text: string[]; isPrivate: number }
) {
  let spinner;
  //       console.log('Inside addTextAsDocument function');
  // // console.log('UserEnv:', userEnv);
  // console.log('UserId:', userdata.userId);
  // console.log('Text:', userdata.text.join('\n'));
  // console.log('IsPrivate:', userdata.isPrivate);
  // Check if userdata is defined and that userdata.text is a string
  if (!userdata || !Array.isArray(userdata.text)) {
    throw new Error('userdata is not defined or userdata.text is not an array of strings');
  }

  spinner = ora({ ...getDefaultOraOptions, text: `Adding text to the Context Vector Store` }).start();

  try {
    //   console.log(`Processing text: ${userdata.text.join('\n')}`);

    // Split the text into sentences or paragraphs
    const textSplitter = new RecursiveCharacterTextSplitter();
    const textDocs = await textSplitter.splitDocuments([
      new Document({
        pageContent: userdata.text.join('\n'),
        metadata: {
          userid: userdata.userId,
          filename: 'prompt_monia_user',
          dateAdded: new Date().toISOString(),
          isPrivate: userdata.isPrivate,
        },
      }),
    ]);

    const vectorStore = await getContextVectorStore(userEnv);
    await vectorStore.addDocuments(textDocs);
    await vectorStore.save(dbDirectory(userEnv));
    spinner.succeed();
  } catch (error) {
    console.error(error);
    spinner.fail();
  }
}

/**
 * The function adds a YouTube video transcript to a Context Vector Store.
 * @param {string} URLOrVideoID - The URLOrVideoID parameter is a string that represents either the URL
 * or the video ID of a YouTube video.
 * @returns Nothing is being returned explicitly in the code, but the function is expected to return
 * undefined after completing its execution.
 */
async function addYouTube(userEnv: UserEnvironment, userdata: { userid: string; url: string; isPrivate: number }) {
  let spinner;
  try {
    spinner = ora({
      ...getDefaultOraOptions,
      text: `Adding Video transcript from ${userdata.url} to the Context Vector Store`,
    }).start();
    const transcript = await YoutubeTranscript.fetchTranscript(userdata.url[0]);
    const text = transcript.map((part) => part.text).join(' ');
    const splitter = new RecursiveCharacterTextSplitter();
    const videoDocs = await splitter.splitDocuments([
      new Document({
        pageContent: text,
        metadata: {
          userid: userdata.userid,
          filename: userdata.url[0],
          extension: null,
          dateAdded: new Date().toISOString(),
          isPrivate: userdata.isPrivate,
        },
      }),
    ]);
    const vectorStore = await getContextVectorStore(userEnv);
    await vectorStore.addDocuments(videoDocs);
    await vectorStore.save(dbDirectory(userEnv));
    spinner.succeed();
    return;
  } catch (error) {
    if (spinner) {
      spinner.fail(chalk.red(error));
    } else {
      output.write(chalk.red(error));
    }
  }
}

/**
 * The function crawls a given URL, extracts text from the pages, splits the text into documents,
 * generates embeddings for the documents, and saves them to a vector store.
 * @param {string} URL - The URL of the website to crawl and extract text from.
 * @param {string} selector - The selector parameter is a string that represents a CSS selector used to
 * identify the HTML elements to be crawled on the web page. The WebCrawler will only crawl the
 * elements that match the selector.
 * @param {number} maxPages - The maximum number of pages to crawl for the given URL.
 * @param {number} numberOfCharactersRequired - `numberOfCharactersRequired` is a number that specifies
 * the minimum number of characters required for a document to be considered valid and used for
 * generating embeddings. Any document with less than this number of characters will be discarded.
 * @returns Nothing is being returned explicitly in the function, but it is implied that the function
 * will return undefined if there are no errors.
 */
async function addURL(
  userEnv: UserEnvironment,
  userdata: {
    userid: string;
    url: Array<string>;
    isPrivate: number;
    selector: string;
    maxPages: number;
    numberOfCharactersRequired: number;
  }
) {
  const addUrlSpinner = ora({ ...getDefaultOraOptions, text: `Crawling ${userdata.url}` });
  let documents;
  try {
    addUrlSpinner.start();
    const progressCallback = (linksFound: number, linksCrawled: number, currentUrl: string) => {
      addUrlSpinner.text = `Links found: ${linksFound} - Links crawled: ${linksCrawled} - Crawling ${currentUrl}`;
    };

    const crawler = new WebCrawler(
      [userdata.url[0]],
      progressCallback,
      userdata.selector,
      userdata.maxPages,
      userdata.numberOfCharactersRequired
    );
    const pages = (await crawler.start()) as Page[];

    documents = await Promise.all(
      pages.map((row) => {
        const splitter = new RecursiveCharacterTextSplitter();

        const webDocs = splitter.splitDocuments([
          new Document({
            pageContent: row.text,
            metadata: {
              userid: userdata.userid,
              filename: userdata.url[0],
              extension: null,
              dateAdded: new Date().toISOString(),
              isPrivate: userdata.isPrivate,
            },
          }),
        ]);
        return webDocs;
      })
    );
    addUrlSpinner.succeed();
  } catch (error) {
    addUrlSpinner.fail(chalk.red(error));
  }
  if (documents) {
    const generateEmbeddingsSpinner = ora({ ...getDefaultOraOptions, text: `Generating Embeddings` });
    try {
      const flattenedDocuments = documents.flat();
      generateEmbeddingsSpinner.text = `Generating Embeddings for ${flattenedDocuments.length} documents`;
      generateEmbeddingsSpinner.start();
      const vectorStore = await getContextVectorStore(userEnv);
      await vectorStore.addDocuments(flattenedDocuments);
      await vectorStore.save(dbDirectory(userEnv));
      generateEmbeddingsSpinner.succeed();
      return;
    } catch (error) {
      generateEmbeddingsSpinner.fail(chalk.red(error));
    }
  }
}

export { getContextVectorStore, addDocument, addTextAsDocument, addURL, addYouTube, deleteDocument };
