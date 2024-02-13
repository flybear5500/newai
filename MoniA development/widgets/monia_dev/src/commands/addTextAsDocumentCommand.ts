import createCommand from './command.js';
import { addTextAsDocument } from '../lib/contextManager.js';
import { UserEnvironment } from '../models/UserEnvironment.js';

const addTextAsDocumentCommand = createCommand(
  'add-text',
  ['text'],
  `Adds new text from a user's fields to the context vector store.`,

  async (args: { userEnv: UserEnvironment; userid: string; docs: string[]; isPrivate: number }) => {
    // console.log("Received data: ", args);
    if (!args || !args.docs || args.docs.length === 0) {
      console.log('Invalid number of arguments. Usage: /add-text userEnv userId example.txt example.md\n');
      return;
    }
    //     console.log('Inside addTextAsDocument command');

    const userId = args.userid;
    const isPrivate = args.isPrivate;
    const userEnv = args.userEnv;
    const text = args.docs;
    //     console.log('userId before calling addTextAsDocument:', userId);
    //     console.log('test before calling addTextAsDocument:', text);
    await addTextAsDocument(userEnv, { userId: userId, text: text, isPrivate: isPrivate });
  }
);

export default addTextAsDocumentCommand;
