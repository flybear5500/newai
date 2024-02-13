import resetChatCommand from './commands/resetChatCommand.js';
import addDocumentCommand from './commands/addDocumentCommand.js';
import addTextAsDocumentCommand from './commands/addTextAsDocumentCommand.js';
import deleteDocumentCommand from './commands/deleteDocumentCommand.js';
import showConvCommand from './commands/showConvCommand.js';
import deleteMemoryConversationCommand from './commands/deleteMemoryConversationCommand.js';
import deleteConversationCommand from './commands/deleteConversationCommand.js';
import deleteOwnConversationCommand from './commands/deleteOwnConversationCommand.js';
import addURLCommand from './commands/addURLCommand.js';
import addYouTubeCommand from './commands/addYouTubeCommand.js';
import setContextConfigCommand from './commands/setContextConfigCommand.js';
import setMemoryConfigCommand from './commands/setMemoryConfigCommand.js';
import toggleWindowBufferMemory from './commands/toggleWindowBufferMemory.js';
import eraseUserCommand from './commands/eraseUserCommand.js';
import type { Command, CommandArgs, CommandArgsWithResultOption } from './commands/command.js';

interface CommandHandler {
  getCommands: () => Command<any>[];
  execute: <TArgs = CommandArgs | CommandArgsWithResultOption>(commandName: string, args: TArgs) => Promise<any>;
}

function createCommandHandler(): CommandHandler {
  const commands: Command<any>[] = [
    resetChatCommand,
    addDocumentCommand,
    addTextAsDocumentCommand,
    deleteDocumentCommand,
    deleteMemoryConversationCommand,
    deleteConversationCommand,
    deleteOwnConversationCommand,
    showConvCommand,
    addURLCommand,
    addYouTubeCommand,
    setContextConfigCommand,
    setMemoryConfigCommand,
    toggleWindowBufferMemory,
    eraseUserCommand,
  ];

  function getCommands() {
    return commands;
  }

  const commandHandler: CommandHandler = {
    getCommands,
    execute: async <TArgs = CommandArgs | CommandArgsWithResultOption>(commandName: string, args: TArgs) => {
      const command = commands.find((cmd) => cmd.name === commandName || cmd.aliases.includes(commandName));
      if (command) {
        const result = await command.execute(args);
        if ((args as CommandArgsWithResultOption).returnResult !== false) {
          return result;
        }
      } else {
        console.log('Unknown command. Type /help to see the list of available commands.\n');
      }
    },
  };

  return commandHandler;
}

export default createCommandHandler;
