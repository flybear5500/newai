import createCommand from './command.js';
import { setUseWindowMemory, getConfig } from '../config/index.js';

const toggleWindowBufferMemory = createCommand(
  'toggle-window-memory',
  ['wm'],
  `Toggles the window buffer memory (MemoryBot's short-term transient memory) on or off.`,
  async (_args) => {
    setUseWindowMemory(!getConfig().useWindowMemory);
    const config = getConfig();
    console.log(`Use Window Buffer Memory set to ${config.useWindowMemory}`);
  }
);
export default toggleWindowBufferMemory;
