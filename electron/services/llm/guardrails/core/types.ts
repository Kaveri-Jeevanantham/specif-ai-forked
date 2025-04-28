/**
 * Type of operation being performed (LLM or Agent)
 */
export type GuardrailOperationType = 'llm' | 'agent';

/**
 * Context information for guardrail validation
 */
export interface GuardrailContext {
  /** Type of operation (llm/agent) */
  type: GuardrailOperationType;
  
  /** Specific operation being performed */
  operation: string;
  
  /** Additional context metadata */
  metadata?: Record<string, any>;
}

/**
 * Result of a validation operation
 */
export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  
  /** Any validation messages/errors */
  messages: string[];
  
  /** Sanitized content if validation modified the input */
  sanitizedContent?: any;
}

/**
 * Configuration options for guardrails
 */
export interface GuardrailConfig {
  /** Whether to throw errors on validation failures */
  strict: boolean;
  
  /** Logging level for guardrail operations */
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  
  /** Custom validation options */
  validationOptions?: Record<string, any>;
}

/**
 * Default configuration for guardrails
 */
export const DEFAULT_GUARDRAIL_CONFIG: GuardrailConfig = {
  strict: true,
  logLevel: 'warn'
};

/**
 * Error thrown when guardrail validation fails
 */
export class GuardrailError extends Error {
  constructor(
    message: string,
    public context: GuardrailContext
  ) {
    super(message);
    this.name = 'GuardrailError';
  }
}
