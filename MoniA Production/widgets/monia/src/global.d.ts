type Command = {
  name: string;
  aliases: string[];
  description: string;
  execute: (args: string[], commandHandler: CommandHandler) => Promise<void>;
};

type CommandHandler = {
  getCommands: () => Command[];
  execute: (commandName: string, args: string[]) => Promise<void>;
};

type Page = {
  url: string;
  text: string;
  title: string;
};

interface Config {
  numContextDocumentsToRetrieve: number;
  numMemoryDocumentsToRetrieve: number;
  useWindowMemory: boolean;
}
