import createCommand from './command.js';
import { deleteConversationFile } from '../chatLogger.js';
import { UserEnvironment } from '../models/UserEnvironment.js';

const deleteConversationCommand = createCommand(
  'delete-conv',
  ['docs'],
  `Delete conversation from a user's chat directory.`,

  async (args: { userEnv: UserEnvironment; userid: string; docs: string[] }) => {
    console.log('docs: ', args.docs);
    console.log('userid: ', args.userid);

    if (!args || !args.docs || args.docs.length === 0 || args.docs.some((doc) => doc === null)) {
      console.log('Invalid arguments. Usage: /delete-docs userId example.txt example.md\n');
      return;
    }

    const userEnv = args.userEnv;
    const documents = args.docs.map((doc) => doc);

    try {
      await deleteConversationFile(userEnv.chatLogDirectory, { docs: documents });
    } catch (error) {
      console.error('Failed to delete conversation file:', error);
    }
  }
);

export default deleteConversationCommand;
