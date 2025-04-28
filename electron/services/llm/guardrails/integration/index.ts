export * from './model-integration';
export * from './workflow-integration';

/**
 * Guardrails Integration for Specif AI
 * 
 * This module provides guardrails for the Create Solution workflow by:
 * 
 * 1. Model Level (model-integration.ts)
 *    - Injects requirement-focused system prompts
 *    - Validates input messages and responses
 *    - Maintains content safety and boundaries
 * 
 * 2. Workflow Level (workflow-integration.ts)
 *    - Integrates with Create Solution workflow
 *    - Applies guardrails to the entire process
 *    - Supports custom validation
 * 
 * Usage:
 * ```typescript
 * import { createGuardedWorkflow } from './guardrails/integration';
 * 
 * const workflow = createGuardedWorkflow({
 *   tools,
 *   model,
 *   checkpointer
 * });
 * 
 * // Workflow automatically:
 * // - Keeps focus on requirements
 * // - Structures domain knowledge
 * // - Maintains professional standards
 * // - Enforces system boundaries
 * const result = await workflow.invoke(initialState);
 * ```
 * 
 * The guardrail system ensures that all interactions:
 * 1. Stay focused on requirement generation
 * 2. Follow professional documentation standards
 * 3. Properly structure domain knowledge
 * 4. Respect system boundaries
 * 5. Maintain content safety
 */
