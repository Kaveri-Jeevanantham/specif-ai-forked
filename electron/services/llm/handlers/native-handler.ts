import { LLMHandler } from '../llm-handler';
import { Message, ModelInfo } from '../llm-types';
import { GuardChain } from '../guardrails/chain';
import { BaseHandler } from './base-handler';

/**
 * Native LLM handler implementation
 */
class NativeLLMHandler extends LLMHandler {
  protected config: Record<string, any>;
  private originalHandler: LLMHandler;

  constructor(
    handler: LLMHandler,
    config: Record<string, any>,
    private processWithGuards: (messages: Message[], operation: string | undefined, processor: (messages: Message[]) => Promise<string>) => Promise<string>
  ) {
    super();
    this.originalHandler = handler;
    this.config = handler.getConfig(config);
  }

  async invoke(messages: Message[], systemPrompt?: string | null, operation?: string): Promise<string> {
    return this.processWithGuards(messages, operation, async (processedMessages) => {
      return this.originalHandler.invoke(processedMessages, systemPrompt, operation);
    });
  }

  getModel(): ModelInfo {
    return this.originalHandler.getModel();
  }

  getConfig(config: Record<string, any>): Record<string, any> {
    return this.originalHandler.getConfig(config);
  }

  isValid(): boolean | Promise<boolean> {
    return this.originalHandler.isValid();
  }
}

/**
 * Factory for creating native handlers
 */
export class NativeHandler extends BaseHandler {
  constructor(
    private handler: LLMHandler,
    guardChain: GuardChain
  ) {
    super(guardChain);
  }

  createHandler(): LLMHandler {
    return new NativeLLMHandler(
      this.handler,
      this.handler.getConfig({}),
      this.processWithGuards.bind(this)
    );
  }
}
