export interface CommandArgs {
  [key: string]: any;
}

export interface CommandArgsWithResultOption extends CommandArgs {
  returnResult?: boolean;
}

export interface Command<TArgs = CommandArgs | CommandArgsWithResultOption> {
  name: string;
  aliases: string[];
  description: string;
  execute: (args: TArgs) => Promise<any>;
}

export default function createCommand<TArgs = CommandArgs | CommandArgsWithResultOption>(
  name: string,
  aliases: string[],
  description: string,
  execute: (args: TArgs) => Promise<any>
): Command<TArgs> {
  return { name, aliases, description, execute };
}
