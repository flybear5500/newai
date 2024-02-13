import createCommand from './command.js';
import { addYouTube } from '../lib/contextManager.js';
import { UserEnvironment } from '../models/UserEnvironment.js';

const addYouTubeCommand = createCommand(
  'add-youtube',
  ['yt'],
  `Adds the transcript from a youtube video and adds it to the context vector store.\n
    Arguments: \`youtube url\` or \`youtube videoid\`\n
    Example: /add-url https://www.youtube.com/watch?v=VMj-3S1tku0`,
  async (args: { userEnv: UserEnvironment; userid: string; url: string; isPrivate: number }) => {
    console.log('Received data: ', args);
    if (!args || !args.url) {
      console.log('Invalid arguments. A URL is required.\n');
      return;
    }
    const userId = args.userid;
    const isPrivate = args.isPrivate;
    const userEnv = args.userEnv;
    const url = args.url;
    await addYouTube(userEnv, { userid: userId, url: url, isPrivate: isPrivate });
  }
);

export default addYouTubeCommand;
