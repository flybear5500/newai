import createCommand from './command.js';
import { addURL } from '../lib/contextManager.js';
import { UserEnvironment } from '../models/UserEnvironment.js';

const addURLCommand = createCommand(
  'add-url',
  ['url'],
  `Scrapes the content from a url and adds it to the context vector store.\n
    Arguments: \`url\`, \`selector to extract\` (Default: body), \`Maximum number of links to follow\` (Default: 20), \`Ignore pages with less than n characters\` (Default: 200)\n
    Example: /add-url https://dociq.io main 10 500\n
    This operation may try to generate a large number of embeddings depending on the structure of the web pages and may lead to rate-limiting.\n
    To avoid this, you can try to target a specific selector such as \`.main\``,
  async (args: {
    userEnv: UserEnvironment;
    userid: string;
    url: string;
    isPrivate: number;
    selector: string;
    maxPages: number;
    numberOfCharactersRequired: number;
  }) => {
    console.log('Received data: ', args);
    if (!args || !args.url) {
      console.log('Invalid arguments. A URL is required.\n');
      return;
    }
    const userId = args.userid;
    const isPrivate = args.isPrivate;
    const userEnv = args.userEnv;
    const url = args.url;
    const selector = args.selector;
    const maxPages = args.maxPages;
    const numberOfCharactersRequired = args.numberOfCharactersRequired;

    await addURL(userEnv, {
      userid: userId,
      url: [url],
      isPrivate: isPrivate,
      selector: selector,
      maxPages: maxPages,
      numberOfCharactersRequired: numberOfCharactersRequired,
    });
  }
);
export default addURLCommand;
