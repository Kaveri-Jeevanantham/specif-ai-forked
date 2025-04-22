import { Entity, Relation, DocumentMetadata } from './entity.types';

export interface GraphNode {
  id: string;
  label: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  properties: Record<string, any>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphQuery {
  type: 'entity' | 'relation' | 'path';
  filters?: {
    property: string;
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex';
    value: any;
  }[];
  limit?: number;
  offset?: number;
}

export interface GraphQueryResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    totalCount: number;
    executionTime: number;
  };
}

export interface GraphUpdateOperation {
  type: 'add' | 'update' | 'delete';
  nodes?: GraphNode[];
  edges?: GraphEdge[];
}

export interface GraphPersistenceOptions {
  format: 'sqlite' | 'json';
  path: string;
  compression?: boolean;
  backup?: boolean;
}

export interface GraphStats {
  nodeCount: number;
  edgeCount: number;
  documentCount: number;
  lastUpdated: Date;
  storageSize: number;
}

export interface GraphBuilderConfig {
  persistenceOptions: GraphPersistenceOptions;
  maxBatchSize: number;
  autoSaveInterval: number;
  indexedProperties: string[];
}
