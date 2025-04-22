import { v4 as uuidv4 } from 'uuid';
import {
  Entity,
  Relation,
  ProcessingResult,
  DocumentMetadata
} from '../types/entity.types';
import {
  GraphNode,
  GraphEdge,
  GraphData,
  GraphBuilderConfig,
  GraphStats,
  GraphUpdateOperation
} from '../types/graph.types';

export class GraphBuilder {
  private nodes: Map<string, GraphNode>;
  private edges: Map<string, GraphEdge>;
  private config: GraphBuilderConfig;
  private documentRegistry: Set<string>;
  private lastUpdate: Date;

  constructor(config: Partial<GraphBuilderConfig> = {}) {
    this.nodes = new Map();
    this.edges = new Map();
    this.documentRegistry = new Set();
    this.lastUpdate = new Date();

    this.config = {
      persistenceOptions: {
        format: 'sqlite',
        path: './knowledge-graph.db',
        compression: true,
        backup: true
      },
      maxBatchSize: 1000,
      autoSaveInterval: 5000, // 5 seconds
      indexedProperties: ['type', 'name', 'sourceDocument'],
      ...config
    };
  }

  public async addDocument(result: ProcessingResult): Promise<void> {
    try {
      // Add document to registry
      this.documentRegistry.add(result.metadata.path);

      // Process entities
      const entityNodes = this.createEntityNodes(result.entities, result.metadata);
      entityNodes.forEach(node => this.nodes.set(node.id, node));

      // Process relations
      const relationEdges = this.createRelationEdges(result.relations, result.metadata);
      relationEdges.forEach(edge => this.edges.set(edge.id, edge));

      // Update timestamp
      this.lastUpdate = new Date();

      // Auto-save if needed
      if (this.shouldAutoSave()) {
        await this.persist();
      }
    } catch (error) {
      console.error('Error adding document to graph:', error);
      throw error;
    }
  }

  private createEntityNodes(entities: Entity[], metadata: DocumentMetadata): GraphNode[] {
    return entities.map(entity => ({
      id: entity.id,
      label: entity.type,
      properties: {
        ...entity.properties,
        name: entity.name,
        sourceDocument: metadata.path,
        confidence: entity.confidence,
        createdAt: new Date().toISOString()
      }
    }));
  }

  private createRelationEdges(relations: Relation[], metadata: DocumentMetadata): GraphEdge[] {
    return relations.map(relation => ({
      id: relation.id,
      source: relation.source,
      target: relation.target,
      label: relation.type,
      properties: {
        ...relation.properties,
        sourceDocument: metadata.path,
        confidence: relation.confidence,
        createdAt: new Date().toISOString()
      }
    }));
  }

  public getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  public getEdge(id: string): GraphEdge | undefined {
    return this.edges.get(id);
  }

  public findNodes(predicate: (node: GraphNode) => boolean): GraphNode[] {
    return Array.from(this.nodes.values()).filter(predicate);
  }

  public findEdges(predicate: (edge: GraphEdge) => boolean): GraphEdge[] {
    return Array.from(this.edges.values()).filter(predicate);
  }

  public async updateGraph(operation: GraphUpdateOperation): Promise<void> {
    switch (operation.type) {
      case 'add':
        operation.nodes?.forEach(node => this.nodes.set(node.id, node));
        operation.edges?.forEach(edge => this.edges.set(edge.id, edge));
        break;
      case 'update':
        operation.nodes?.forEach(node => {
          const existing = this.nodes.get(node.id);
          if (existing) {
            this.nodes.set(node.id, { ...existing, ...node });
          }
        });
        operation.edges?.forEach(edge => {
          const existing = this.edges.get(edge.id);
          if (existing) {
            this.edges.set(edge.id, { ...existing, ...edge });
          }
        });
        break;
      case 'delete':
        operation.nodes?.forEach(node => this.nodes.delete(node.id));
        operation.edges?.forEach(edge => this.edges.delete(edge.id));
        break;
    }

    this.lastUpdate = new Date();
    if (this.shouldAutoSave()) {
      await this.persist();
    }
  }

  public getGraphData(): GraphData {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values())
    };
  }

  public getStats(): GraphStats {
    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size,
      documentCount: this.documentRegistry.size,
      lastUpdated: this.lastUpdate,
      storageSize: this.calculateStorageSize()
    };
  }

  private calculateStorageSize(): number {
    // Rough estimation of memory usage
    const nodeSize = JSON.stringify(Array.from(this.nodes.values())).length;
    const edgeSize = JSON.stringify(Array.from(this.edges.values())).length;
    return nodeSize + edgeSize;
  }

  private shouldAutoSave(): boolean {
    return Date.now() - this.lastUpdate.getTime() >= this.config.autoSaveInterval;
  }

  public async persist(): Promise<void> {
    // Implementation will be added when we create the persistence service
    console.log('Persisting graph...');
  }

  public async load(): Promise<void> {
    // Implementation will be added when we create the persistence service
    console.log('Loading graph...');
  }

  public clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.documentRegistry.clear();
    this.lastUpdate = new Date();
  }
}
