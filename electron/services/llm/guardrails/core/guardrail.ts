import { BaseValidator } from './base-validator';
import {
  GuardrailConfig,
  GuardrailContext,
  GuardrailError,
  ValidationResult,
  DEFAULT_GUARDRAIL_CONFIG
} from './types';

/**
 * Main guardrail class that orchestrates validation
 */
export class Guardrail {
  private validators: BaseValidator[] = [];

  constructor(
    validators: BaseValidator[] = [],
    private config: GuardrailConfig = DEFAULT_GUARDRAIL_CONFIG
  ) {
    this.validators = validators.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Adds a validator to the guardrail
   */
  addValidator(validator: BaseValidator): void {
    this.validators.push(validator);
    this.validators.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Validates input using all enabled validators
   */
  async validate(
    input: any,
    context: GuardrailContext
  ): Promise<ValidationResult> {
    let currentInput = input;
    const messages: string[] = [];

    for (const validator of this.validators) {
      if (!validator.enabled) continue;

      try {
        const result = await validator.validate(currentInput, context);
        
        if (!result.isValid) {
          messages.push(...result.messages);
          
          if (this.config.strict) {
            throw new GuardrailError(
              `Validation failed: ${result.messages.join('; ')}`,
              context
            );
          }
        }

        if (result.sanitizedContent !== undefined) {
          currentInput = result.sanitizedContent;
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        
        if (error instanceof GuardrailError) {
          throw error;
        }
        
        const message = `Validator ${validator.id} failed: ${error.message}`;
        messages.push(message);
        
        if (this.config.strict) {
          throw new GuardrailError(message, context);
        }
      }
    }

    return {
      isValid: messages.length === 0,
      messages,
      sanitizedContent: currentInput
    };
  }

  /**
   * Gets the current configuration
   */
  getConfig(): GuardrailConfig {
    return { ...this.config };
  }

  /**
   * Updates the configuration
   */
  updateConfig(config: Partial<GuardrailConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }

  /**
   * Gets all registered validators
   */
  getValidators(): BaseValidator[] {
    return [...this.validators];
  }

  /**
   * Enables a validator by ID
   */
  enableValidator(id: string): void {
    const validator = this.validators.find(v => v.id === id);
    if (validator) {
      validator.enabled = true;
    }
  }

  /**
   * Disables a validator by ID
   */
  disableValidator(id: string): void {
    const validator = this.validators.find(v => v.id === id);
    if (validator) {
      validator.enabled = false;
    }
  }
}
