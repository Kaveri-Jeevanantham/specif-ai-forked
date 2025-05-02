import { LLMHandler } from '../llm-handler';
import { Message, ModelInfo } from '../llm-types';
import { GuardChain } from '../guardrails/chain';
import { LangChainModelProvider } from '../langchain-providers/base';
import { BaseHandler } from './base-handler';
import { SystemMessage, HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

/**
 * LangChain-specific LLM handler implementation
 */
class LangChainLLMHandler extends LLMHandler {
  protected config: Record<string, any>;
  private langchainModel: BaseChatModel;

  constructor(
    private provider: LangChainModelProvider,
    config: Record<string, any>,
    private processWithGuards: (messages: Message[], operation: string | undefined, processor: (messages: Message[]) => Promise<string>) => Promise<string>
  ) {
    super();
    this.config = config;
    this.langchainModel = provider.getModel();
  }

  async invoke(messages: Message[], systemPrompt?: string | null, operation?: string): Promise<string> {
    return this.processWithGuards(messages, operation, async (processedMessages) => {
      const langchainMessages = LangChainLLMHandler.convertToLangChainMessages(processedMessages);
      const finalMessages = this.addSystemPrompt(langchainMessages, systemPrompt);
      const response = await this.langchainModel.invoke(finalMessages);
      return LangChainLLMHandler.extractResponseContent(response);
    });
  }

  getModel(): ModelInfo {
    return this.provider.getModelInfo();
  }

  getConfig(): Record<string, any> {
    return this.config;
  }

  isValid(): boolean | Promise<boolean> {
    return this.provider.isValid();
  }

  private addSystemPrompt(messages: BaseMessage[], systemPrompt?: string | null): BaseMessage[] {
    return systemPrompt 
      ? [new SystemMessage(systemPrompt), ...messages]
      : messages;
  }

  private static convertToLangChainMessages(messages: Message[]): BaseMessage[] {
    return messages.map(m => {
      switch (m.role) {
        case 'system': return new SystemMessage(m.content);
        case 'user': return new HumanMessage(m.content);
        case 'assistant': return new AIMessage(m.content);
        default: throw new Error(`Unknown message role: ${m.role}`);
      }
    });
  }

  private static extractResponseContent(response: unknown): string {
    if (typeof response === 'string') {
      return response;
    }
    
    if (response && typeof response === 'object' && 'content' in response) {
      return String(response.content);
    }
    
    if (Array.isArray(response)) {
      return response
        .filter((r): r is { content: unknown } => 
          r && typeof r === 'object' && 'content' in r
        )
        .map(r => String(r.content))
        .join('\n');
    }
    
    return '';
  }
}

/**
 * Factory for creating LangChain handlers
 */
export class LangChainHandler extends BaseHandler {
  constructor(
    private provider: LangChainModelProvider,
    private config: Record<string, any>,
    guardChain: GuardChain
  ) {
    super(guardChain);
  }

  getProvider(): LangChainModelProvider {
    return this.provider;
  }

  /**
   * Creates a new LangChain handler instance.
   * @returns {LLMHandler} The created LLM handler.
   */

  createHandler(): LLMHandler {
    return new LangChainLLMHandler(
      this.provider,
      this.config,
      this.processWithGuards.bind(this)
    );
  }
}
