import { BaseGuard } from './core/base-guard';
import { GuardrailContext, ValidationResult } from './core/types';
import { Message } from '../llm-types';

/**
 * Implements chain of responsibility for guards
 */
export class GuardChain {
  private readonly guards: BaseGuard[];

  constructor(guards: BaseGuard[]) {
    // Sort guards by priority
    this.guards = guards.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Process input through the guard chain
   */
  async processInput(input: Message[], context: GuardrailContext): Promise<Message[]> {
    let currentInput = input;

    // Forward chain - validate input
    for (const guard of this.guards) {
      if (!guard.enabled) continue;

      const result = await guard.validate(currentInput, context);
      if (!result.isValid) {
        throw new Error(`Guard ${guard.id} validation failed: ${result.messages.join('; ')}`);
      }

      if (result.sanitizedContent) {
        currentInput = result.sanitizedContent;
      }
    }

    return currentInput;
  }

  /**
   * Process output through the guard chain
   */
  async processOutput(response: string, context: GuardrailContext): Promise<string> {
    let currentResponse = response;

    // Reverse chain - validate output
    for (const guard of [...this.guards].reverse()) {
      if (!guard.enabled) continue;

      const result = await guard.validateOutput(currentResponse, context);
      if (!result.isValid) {
        throw new Error(`Guard ${guard.id} output validation failed: ${result.messages.join('; ')}`);
      }

      if (result.sanitizedContent) {
        currentResponse = result.sanitizedContent;
      }
    }

    return currentResponse;
  }
}
