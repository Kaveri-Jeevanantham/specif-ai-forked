import { GuardrailContext, ValidationResult } from './types';

/**
 * Base class for all guards in the chain
 */
export abstract class BaseGuard {
  /**
   * Unique identifier for the guard
   */
  abstract readonly id: string;

  /**
   * Priority of the guard (lower numbers run first)
   */
  abstract readonly priority: number;

  /**
   * Whether the guard is enabled
   */
  enabled: boolean = true;

  /**
   * Validates input before processing
   */
  abstract validate(input: any, context: GuardrailContext): Promise<ValidationResult>;

  /**
   * Validates output after processing
   */
  abstract validateOutput(response: any, context: GuardrailContext): Promise<ValidationResult>;

  /**
   * Creates a successful validation result
   */
  protected success(sanitizedContent?: any): ValidationResult {
    return {
      isValid: true,
      messages: [],
      sanitizedContent
    };
  }

  /**
   * Creates a failed validation result
   */
  protected failure(messages: string[]): ValidationResult {
    return {
      isValid: false,
      messages
    };
  }
}
