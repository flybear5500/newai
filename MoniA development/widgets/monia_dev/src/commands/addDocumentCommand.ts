// import path from 'path';
import createCommand from './command.js';
import { addDocument } from '../lib/contextManager.js';
// import { fileURLToPath } from 'url';
import { UserEnvironment } from '../models/UserEnvironment.js';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const addDocumentCommand = createCommand(
  'add-docs',
  ['docs'],
  `Adds new documents from a user's directory to the context vector store.\n
    Supports the following file types: .txt, .md, .pdf, .docx, .csv, .epub`,
  async (args: { userEnv: UserEnvironment; userid: string; docs: string[]; isPrivate: number }) => {
    // console.log("Received data: ", args);
    // console.log("Type of received data: ", typeof args);
    // console.log("docs: ", args.docs);
    // console.log("userid: ", args.userid);
    // console.log("private: ", args.isPrivate);
    if (!args || !args.docs || args.docs.length === 0) {
      console.log('Invalid number of arguments. Usage: /add-docs userId example.txt example.md\n');
      return;
    }
    const { userEnv, userid, docs, isPrivate } = args;
    //     const userDirectory = path.join(__dirname, '/images/comprofiler/plug_cbgallery/', userId, 'files');
    const documents = docs.map((doc) => doc);
    console.log('documents:', documents);
    console.log('privacies:', isPrivate);
    await addDocument(userEnv, { userid, docs: documents, isPrivate });
  }
);

export default addDocumentCommand;
