import createCommand from './command.js';
import { setNumMemoryDocumentsToRetrieve, getConfig } from '../config/index.js';
import { UserEnvironment } from '../models/UserEnvironment.js';

const setMemoryConfigCommand = createCommand(
  'memory-config',
  ['mc'],
  `Sets the number of relevant documents to return from the memory vector store.\n
    Arguments: \`number of documents\` (Default: 4)\n
    Example: /memory-config 10`,
  async (args: { userEnv: UserEnvironment; userid: string }) => {
    const { userEnv } = args;
    if (!args) {
      console.log('Invalid number of arguments. Usage: /memory-config `number of documents`\n');
      return;
    }
    const numMemoryDocumentsToRetrieve = userEnv.presence;
    //     setNumMemoryDocumentsToRetrieve(numMemoryDocumentsToRetrieve);
    setNumMemoryDocumentsToRetrieve(6);
    const config = getConfig();
    console.log(`Number of memory documents to retrieve set to ${config.numMemoryDocumentsToRetrieve}`);
    console.log(numMemoryDocumentsToRetrieve);
  }
);
export default setMemoryConfigCommand;
