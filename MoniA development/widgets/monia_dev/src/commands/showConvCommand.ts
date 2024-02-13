import createCommand from './command.js';
import { CommandArgsWithResultOption } from './command.js';
import { showConversationFiles } from '../chatLogger.js';
// import { UserEnvironment } from '../index.js';

const showConvCommand = createCommand<CommandArgsWithResultOption & { userDir: string; userid: string }>(
  'show-conv',
  ['userid'],
  `show conversations from a user's chat directory which have userid in the filename.`,
  async (args) => {
    console.log('userid: ', args.userid);

    const numericUserId = Number(args.userid);

    if (!args || !args.userid || numericUserId === 0 || isNaN(numericUserId)) {
      console.log('Invalid arguments. Usage: /show-conv userId\n');
      return;
    }

    const userDir = args.userDir;
    const userid = args.userid;

    try {
      const files = await showConversationFiles(userDir, userid);
      // 	  console.log('read files', files);
      return files;
    } catch (error) {
      console.error('Failed to show conversation files:', error);
      return null;
    }
  }
);

export default showConvCommand;
