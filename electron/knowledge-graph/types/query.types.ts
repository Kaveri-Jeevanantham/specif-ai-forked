import { GraphNode, GraphEdge, GraphQueryResult } from './graph.types';
import { Entity, Relation } from './entity.types';

export interface QueryContext {
  maxResults?: number;
  minConfidence?: number;
  includeSources?: boolean;
  timeout?: number;
}

export interface SemanticQueryOptions {
  useEmbeddings: boolean;
  similarityThreshold: number;
  maxDistance: number;
  contextWindow: number;
}

export type QueryType = 'semantic' | 'structured' | 'hybrid';

export interface BaseQuery {
  type: QueryType;
  context?: QueryContext;
}

export interface SemanticQuery extends BaseQuery {
  type: 'semantic';
  query: string;
  options?: Partial<SemanticQueryOptions>;
}

export interface StructuredQuery extends BaseQuery {
  type: 'structured';
  patterns: {
    nodes: Array<{
      id?: string;
      label?: string;
      properties?: Record<string, any>;
    }>;
    edges: Array<{
      source: string;
      target: string;
      label?: string;
      properties?: Record<string, any>;
    }>;
  };
}

export interface HybridQuery extends BaseQuery {
  type: 'hybrid';
  semantic: {
    query: string;
    options?: Partial<SemanticQueryOptions>;
  };
  structured: {
    patterns: StructuredQuery['patterns'];
  };
  strategy: 'parallel' | 'sequential' | 'weighted';
}

export type Query = SemanticQuery | StructuredQuery | HybridQuery;

export interface QueryMatch {
  nodes: GraphNode[];
  edges: GraphEdge[];
  score: number;
  context?: string;
}

export interface QueryResult {
  matches: QueryMatch[];
  metadata: {
    totalResults: number;
    executionTime: number;
    confidence: number;
    strategy: string;
  };
}

export interface QueryError {
  code: string;
  message: string;
  query: Query;
  details?: any;
}

export interface QueryStats {
  totalQueries: number;
  averageExecutionTime: number;
  successRate: number;
  commonPatterns: Array<{
    pattern: string;
    count: number;
  }>;
}

export interface QueryCache {
  key: string;
  query: Query;
  result: QueryResult;
  timestamp: Date;
  ttl: number;
}

export interface QueryOptimizationHint {
  type: 'index' | 'pattern' | 'cache';
  description: string;
  impact: 'high' | 'medium' | 'low';
  suggestion: string;
}
