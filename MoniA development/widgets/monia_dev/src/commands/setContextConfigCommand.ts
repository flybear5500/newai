import createCommand from './command.js';
import { setNumContextDocumentsToRetrieve, getConfig } from '../config/index.js';

const setContextConfigCommand = createCommand(
  'context-config',
  ['cc'],
  `Sets the number of relevant documents to return from the context vector store.\n
    Arguments: \`number of documents\` (Default: 6)\n
    Example: \`/context-config 10\``,
  async (args) => {
    if (!args || args.length !== 1) {
      console.log('Invalid number of arguments. Usage: /context-config `number of documents`\n');
      return;
    }
    const numContextDocumentsToRetrieve = parseInt(args[0], 10);
    setNumContextDocumentsToRetrieve(numContextDocumentsToRetrieve);
    const config = getConfig();
    console.log(`Number of context documents to retrieve set to ${config.numContextDocumentsToRetrieve}`);
  }
);
export default setContextConfigCommand;
