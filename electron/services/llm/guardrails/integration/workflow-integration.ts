import { BaseCheckpointSaver } from "@langchain/langgraph";
import { LangChainModelProvider } from "../../langchain-providers/base";
import { ITool } from "../../../../agentic/common/types";
import { buildCreateSolutionWorkflow } from "../../../../agentic/create-solution-workflow";
import { createGuardedModel } from "./model-integration";
import { BaseValidator } from "../core/base-validator";
import { ContentValidator } from "../validators/content";
import { BoundaryValidator } from "../validators/boundary";

/**
 * Parameters for creating a guarded workflow
 */
interface GuardedWorkflowParams {
  /** Tools for research and generation */
  tools: Array<ITool>;
  
  /** LLM model provider */
  model: LangChainModelProvider;
  
  /** Optional checkpointer for workflow state */
  checkpointer?: BaseCheckpointSaver | false | undefined;

  /** Optional validators for additional guardrails */
  validators?: BaseValidator[];
}

/**
 * Default validators used in the workflow
 */
const DEFAULT_WORKFLOW_VALIDATORS = [
  new ContentValidator(),
  new BoundaryValidator()
];

/**
 * Creates a guarded version of the Create Solution workflow that enforces:
 * - Requirement-focused responses
 * - Professional documentation standards
 * - Domain knowledge structuring
 * - Content and boundary validation
 */
export function createGuardedWorkflow({
  tools,
  model,
  checkpointer,
  validators = DEFAULT_WORKFLOW_VALIDATORS
}: GuardedWorkflowParams) {
  try {
    // Create guarded model with validators
    const guardedModel = createGuardedModel(model, validators);

    // Create workflow with guarded model
    return buildCreateSolutionWorkflow({
      tools,
      model: guardedModel,
      checkpointer
    });
  } catch (error) {
    throw new Error(
      `Failed to create guarded workflow: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Usage:
 * ```typescript
 * const workflow = createGuardedWorkflow({
 *   tools,
 *   model,
 *   checkpointer,
 *   // Optional custom validators
 *   validators: [
 *     new ContentValidator(),
 *     new BoundaryValidator(),
 *     // Add your custom validators
 *   ]
 * });
 * ```
 * 
 * The workflow will automatically:
 * 1. Validate all inputs and outputs
 * 2. Keep responses requirement-focused
 * 3. Maintain professional standards
 * 4. Structure domain knowledge appropriately
 */
