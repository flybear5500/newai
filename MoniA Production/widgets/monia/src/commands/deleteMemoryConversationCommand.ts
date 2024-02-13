import createCommand from './command.js';
import { deleteConversation } from '../lib/memoryManager.js';
import { UserEnvironment } from '../models/UserEnvironment.js';

const deleteMemoryConversationCommand = createCommand(
  'delete-mem-conv',
  ['docs'],
  `Delete documents from a user's directory to the context vector store.\n
    Supports the following file types: .txt, .md, .pdf, .docx, .csv, .epub`,

  async (args: { userEnv: UserEnvironment; userid: string; docs: string[] }) => {
    //  console.log("Received data: ", args);
    //  console.log("Type of received data: ", typeof args);
    // console.log("docs: ", args.docs);
    // console.log("userid: ", args.userid);
    // console.log("private: ", args.isPrivate);
    if (!args || !args.docs || args.docs.length === 0) {
      console.log('Invalid number of arguments. Usage: /delete-docs userId example.txt example.md\n');
      return;
    }
    const userEnv = args.userEnv;
    const documents = args.docs.map((doc) => doc);
    await deleteConversation(userEnv, { docs: documents });
  }
);

export default deleteMemoryConversationCommand;
