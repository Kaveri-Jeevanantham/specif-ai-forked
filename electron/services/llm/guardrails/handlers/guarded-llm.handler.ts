import LLMHandler from '../../llm-handler';
import { Message, ModelInfo } from '../../llm-types';
import { Guardrail } from '../core/guardrail';
import { ContentValidator } from '../validators/content';
import { BoundaryValidator } from '../validators/boundary';

const DEFAULT_VALIDATORS = [
  new ContentValidator(),
  new BoundaryValidator()
];

export class GuardedLLMHandler extends LLMHandler {
  private baseHandler: LLMHandler;
  private guardrail: Guardrail;

  constructor(handler: LLMHandler) {
    super();
    this.baseHandler = handler;
    this.guardrail = new Guardrail(DEFAULT_VALIDATORS);
  }

  async invoke(messages: Message[], systemPrompt?: string | null, operation?: string): Promise<string> {
    // Validate input
    const inputValidation = await this.guardrail.validate(messages, {
      type: 'llm',
      operation: operation || 'default'
    });

    if (!inputValidation.isValid) {
      throw new Error(`Input validation failed: ${inputValidation.messages.join('; ')}`);
    }

    // Process with base handler
    const response = await this.baseHandler.invoke(
      inputValidation.sanitizedContent || messages,
      systemPrompt,
      operation
    );

    // Validate output
    const outputValidation = await this.guardrail.validate(response, {
      type: 'llm',
      operation: `${operation || 'default'}_response`
    });

    if (!outputValidation.isValid) {
      throw new Error(`Output validation failed: ${outputValidation.messages.join('; ')}`);
    }

    return outputValidation.sanitizedContent || response;
  }

  getConfig(config: Record<string, any>): Record<string, any> {
    return this.baseHandler.getConfig(config);
  }

  getModel(): ModelInfo {
    return this.baseHandler.getModel();
  }

  isValid(): boolean | Promise<boolean> {
    return this.baseHandler.isValid();
  }
}

export function createGuardedHandler(handler: LLMHandler): LLMHandler {
  return new GuardedLLMHandler(handler);
}
