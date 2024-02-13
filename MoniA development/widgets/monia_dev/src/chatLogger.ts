import fs from 'fs-extra';
import path from 'path';

interface ChatHistory {
  timestamp: string;
  question: string;
  answer: string;
  website: string;
}

const ensureLogDirectory = (logDirectory: string, userId: string): void => {
  fs.ensureDirSync(path.join(logDirectory, userId));
};

const getLogFilename = (userId: string): string => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');

  return `${userId}-${year}-${month}-${day}.json`;
};

// const getOwnLogFilename = (): string => {
//   const currentDate = new Date();
//   const year = currentDate.getFullYear();
//   const month = String(currentDate.getMonth() + 1).padStart(2, '0');
//   const day = String(currentDate.getDate()).padStart(2, '0');
//
//   return `${year}-${month}-${day}.json`;
// };

const logChat = async (
  logDirectory: string,
  userId: string,
  question: string,
  answer: string,
  website: string
): Promise<void> => {
  const timestamp = new Date().toISOString();
  const chatHistory: ChatHistory = { timestamp, question, answer, website };
  const logFilename = getLogFilename(userId);
  const logFilePath = path.join(logDirectory, userId, logFilename);

  ensureLogDirectory(logDirectory, userId);

  if (!fs.existsSync(logFilePath)) {
    await fs.writeJson(logFilePath, [chatHistory]);
  } else {
    const chatHistoryArray = await fs.readJson(logFilePath);
    chatHistoryArray.push(chatHistory);
    await fs.writeJson(logFilePath, chatHistoryArray);
  }
};

const logOwnChat = async (
  logDirectory: string,
  userId: string,
  question: string,
  answer: string,
  website: string
): Promise<void> => {
  const timestamp = new Date().toISOString();
  const chatHistory: ChatHistory = { timestamp, question, answer, website };
  const logFilename = getLogFilename(userId);

  const ownLogDirectory = path.join(logDirectory, '1');
  fs.ensureDirSync(ownLogDirectory);

  const logFilePath = path.join(ownLogDirectory, logFilename);

  if (!fs.existsSync(logFilePath)) {
    await fs.writeJson(logFilePath, [chatHistory]);
  } else {
    const chatHistoryArray = await fs.readJson(logFilePath);
    chatHistoryArray.push(chatHistory);
    await fs.writeJson(logFilePath, chatHistoryArray);
  }
};

async function deleteConversationFile(logDirectory: string, userdata: any): Promise<void> {
  const relativeFilePath = userdata.docs[0];

  if (!relativeFilePath) {
    throw new Error('Invalid argument: relativeFilePath is null');
  }

  const filePath = path.join(logDirectory, relativeFilePath);

  try {
    await fs.remove(filePath);
  } catch (error) {
    console.error(`Failed to delete file: ${filePath}`);
    throw error;
  }
}

async function deleteOwnConversationFile(logDirectory: string, docs: any): Promise<void> {
  console.log(docs);
  // Vérifie si userdata et userdata.docs existent
  if (!docs || docs.length === 0) {
    throw new Error('User data or documents not defined');
  }

  logDirectory = path.join(logDirectory, '/');

  const relativeFilePath = docs[0];

  // Vérifie si le répertoire existe
  if (!fs.existsSync(logDirectory)) {
    throw new Error('User log directory does not exist');
  }

  const filePath = path.join(logDirectory, relativeFilePath);
  console.log(logDirectory + relativeFilePath);

  try {
    await fs.remove(filePath);
  } catch (error) {
    console.error(`Failed to delete file: ${filePath}`);
    throw error;
  }
}

async function showConversationFiles(logDirectory: string, userid: string): Promise<string[]> {
  //     const userLogDirectory = path.join(logDirectory, userid.toString());

  // Vérifie si le répertoire existe
  if (!fs.existsSync(logDirectory)) {
    return [];
  }

  // Lis les fichiers du répertoire
  const files = await fs.readdir(logDirectory);

  // Filtrage des fichiers qui commencent par l'userId
  const jsonFiles = files.filter((file) => file.startsWith(userid) && file.endsWith('.json'));

  return jsonFiles;
}

export {
  logChat,
  logOwnChat,
  getLogFilename,
  showConversationFiles,
  deleteConversationFile,
  deleteOwnConversationFile,
};
