import createCommand from './command.js';
import { existsSync, readdirSync, lstatSync, unlinkSync, rmdirSync } from 'fs';
import path from 'path';

function deleteFolderRecursive(filePath: string) {
  if (existsSync(filePath)) {
    if (lstatSync(filePath).isDirectory()) {
      readdirSync(filePath).forEach((file) => {
        const curPath = path.join(filePath, file);
        deleteFolderRecursive(curPath);
      });
      rmdirSync(filePath);
    } else {
      unlinkSync(filePath);
    }
  } else {
    console.log(`Path does not exist: ${filePath}`);
  }
}

const eraseUserCommand = createCommand(
  'erase-user',
  ['q'],
  'Terminates the user by deleting specified folders',
  async (args) => {
    const { userEnv, userid, folders } = args;
    console.log('Passed folders: ', folders);

    try {
      const allFolders: Record<string, string> = {
        vector: path.join(process.cwd(), userEnv.vectorStoreBaseDir),
        memory: path.join(process.cwd(), userEnv.memoryVectorStoreDir),
        docs: path.join(process.cwd(), userEnv.docsStoreDir),
        chat: path.join(process.cwd(), userEnv.chatLogDirectory),
        prompt: path.join(process.cwd(), userEnv.systemPromptDirectory),
        config: path.join(process.cwd(), userEnv.configBaseDir),
      };

      try {
        for (const folder in allFolders) {
          const folderPath = allFolders[folder];
          if ((!folders || folders.includes(folder)) && existsSync(folderPath)) {
            console.log(`Attempting to delete ${folderPath}`);
            deleteFolderRecursive(folderPath);
            console.log(`Successfully deleted ${folderPath}`);
          }
        }
      } catch (err) {
        if (err instanceof Error) {
          console.log(`\nAn error occurred while deleting user data: ${err.message}\n`);
        } else {
          console.log(`\nAn error occurred while deleting user data\n`);
        }
      }

      console.log(`\nDeleted specified data for user ${userid}, bye!\n`);
    } catch (err) {
      console.log(`\nAn error occurred while erasing user: ${err}\n`);
    }
  }
);

export default eraseUserCommand;
