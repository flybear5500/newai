import { UserEnvironment } from '../models/UserEnvironment.js';
import { resetMemoryVectorStore, setMemoryVectorStore, resetBufferWindowMemory } from '../lib/memoryManager.js';
import createCommand from './command.js';

const resetChatCommand = createCommand(
  'reset',
  [],
  'Resets the chat and starts a new conversation - This clears the memory vector store and the buffer window memory.',
  async (args: { userEnv: UserEnvironment; userid: string }) => {
    const { userEnv } = args;
    console.log('Resetting chat for userEnv: ', args.userEnv);
    const newMemoryVectorStore = await resetMemoryVectorStore(userEnv);
    setMemoryVectorStore(newMemoryVectorStore);
    resetBufferWindowMemory(userEnv);
  }
);

export default resetChatCommand;
