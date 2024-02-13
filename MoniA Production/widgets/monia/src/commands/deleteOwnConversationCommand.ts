import createCommand from './command.js';
import { deleteOwnConversationFile } from '../chatLogger.js';

const deleteOwnConversationCommand = createCommand(
  'delete-own-conv',
  ['docs'],
  `Delete conversation from a user's own chat directory.`,

  async (args: { userDir: string; docs: string[] }) => {
    console.log('docs: ', args.docs);
    console.log('userDir: ', args.userDir);

    if (!args || !args.docs) {
      console.log('Invalid arguments. Usage: /delete-own-conv userId\n');
      return;
    }

    const userDir = args.userDir;
    const docs = args.docs.map((doc) => doc);

    try {
      await deleteOwnConversationFile(userDir, docs);
    } catch (error) {
      console.error('Failed to delete conversation file:', error);
    }
  }
);

export default deleteOwnConversationCommand;
