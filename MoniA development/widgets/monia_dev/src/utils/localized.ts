import { AgentActionOutputParser, AgentExecutor, LLMSingleActionAgent } from 'langchain/agents';
import { LLMChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import {
  BaseChatPromptTemplate,
  BasePromptTemplate,
  SerializedBasePromptTemplate,
  renderTemplate,
} from 'langchain/prompts';
import {
  AgentAction,
  AgentFinish,
  AgentStep,
  BaseMessage,
  HumanMessage,
  InputValues,
  PartialValues,
} from 'langchain/schema';

// const PREFIX = `Answer the following questions as best you can. You have access to the following tools:`;
// const FORMAT_INSTRUCTIONS = (
//   toolNames: string
// ) => `Use the following format in your response:
//
// Question: the input question you must answer
// Thought: you should always think about what to do
// Action: the action to take, should be one of [${toolNames}]
// Action Input: the input to the action
// Observation: the result of the action
// ... (this Thought/Action/Action Input/Observation can repeat N times)
// Thought: I now know the final answer
// Final Answer: the final answer to the original input question`;
// const SUFFIX = `Begin!
//
// Question: {input}
// Thought:{agent_scratchpad}`;

export class CustomPromptTemplate extends BaseChatPromptTemplate {
  tools: Tool[];
  localizedPrompts: any;
  localizedPromptsPromise: Promise<void>;

  constructor(args: { tools: Tool[]; inputVariables: string[] }, lang: string) {
    super({ inputVariables: args.inputVariables });
    this.tools = args.tools;
    this.localizedPromptsPromise = this.loadLocalizedPrompts(lang);
  }

  _getPromptType(): string {
    return 'custom_prompt';
  }

  loadLocalizedPrompts(lang: string): Promise<void> {
    return new Promise((resolve, reject) => {
      import(`../prompts/${lang}_prompt.js`)
        .then((prompts) => {
          this.localizedPrompts = prompts.default;
          console.log(`Prompts loaded for language: ${lang}`);
          resolve();
        })
        .catch((error) => {
          console.warn(`No localized prompts found for language '${lang}', falling back to default prompts.`);
          import('../prompts/abs_prompt.js')
            .then((prompts) => {
              this.localizedPrompts = prompts.default;
              console.log(`Default prompts loaded due to missing prompts for language: ${lang}`);
              resolve();
            })
            .catch((error) => {
              console.error(`Failed to load default prompts: ${error}`);
              reject(error);
            });
        });
    });
  }

  async formatMessages(values: InputValues): Promise<BaseMessage[]> {
    // Block until localizedPrompts is ready
    await this.localizedPromptsPromise;

    // Now continue as normal...
    const toolStrings = this.tools.map((tool) => `${tool.name}: ${tool.description}`).join('\n');
    const toolNames = this.tools.map((tool) => tool.name).join('\n');

    const instructions = this.localizedPrompts ? this.localizedPrompts.FORMAT_INSTRUCTIONS : FORMAT_INSTRUCTIONS;
    const template = this.localizedPrompts
      ? [this.localizedPrompts.DEFAULT_PREFIX, toolStrings, instructions, this.localizedPrompts.DEFAULT_SUFFIX].join(
          '\n\n'
        )
      : [DEFAULT_PREFIX, toolStrings, instructions, DEFAULT_SUFFIX].join('\n\n');

    const intermediateSteps = values.intermediate_steps as AgentStep[];
    const agentScratchpad = intermediateSteps.reduce(
      (thoughts, { action, observation }) =>
        thoughts + [action.log, `\nObservation: ${observation}`, 'Thought:'].join('\n'),
      ''
    );

    const tools = this.tools;

    const newInput = {
      tool_names: toolNames,
      tools: tools,
      agent_scratchpad: agentScratchpad,
      format_instructions: instructions,
      ...values,
    };
    const formatted = renderTemplate(template, 'f-string', newInput);
    return [new HumanMessage(formatted)];
  }

  partial(_values: PartialValues): Promise<BasePromptTemplate> {
    throw new Error('Not implemented');
  }

  serialize(): SerializedBasePromptTemplate {
    throw new Error('Not implemented');
  }
}

export class CustomOutputParser extends AgentActionOutputParser {
  lc_namespace = ['langchain', 'agents', 'custom_llm_agent_chat'];

  async parse(text: string): Promise<AgentAction | AgentFinish> {
    let jsonOutput = text.trim();
    if (jsonOutput.includes('```json') || jsonOutput.includes('```')) {
      const testString = jsonOutput.includes('```json') ? '```json' : '```';
      const firstIndex = jsonOutput.indexOf(testString);
      const actionInputIndex = jsonOutput.indexOf('action_input');
      if (actionInputIndex > firstIndex) {
        jsonOutput = jsonOutput.slice(firstIndex + testString.length).trimStart();
        const lastIndex = jsonOutput.lastIndexOf('```');
        if (lastIndex !== -1) {
          jsonOutput = jsonOutput.slice(0, lastIndex).trimEnd();
        }
      }
    }

    try {
      const response = JSON.parse(jsonOutput);

      const { action, action_input } = response;

      if (action === 'Final Answer') {
        return { returnValues: { output: action_input }, log: text };
      }
      return { tool: action, toolInput: action_input, log: text };
    } catch (e) {
      throw new OutputParserException(`Failed to parse. Text: "${text}". Error: ${e}`);
    }
  }

  getFormatInstructions(): string {
    return renderTemplate(FORMAT_INSTRUCTIONS, 'f-string', {
      tool_names: this.toolNames.join(', '),
    });
  }
}
