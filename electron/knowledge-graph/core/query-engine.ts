import { GraphBuilder } from './graph-builder';
import {
  Query,
  QueryResult,
  SemanticQuery,
  StructuredQuery,
  HybridQuery,
  QueryContext,
  QueryError,
  QueryStats,
  QueryMatch
} from '../types/query.types';
import { GraphNode, GraphEdge } from '../types/graph.types';

export class QueryEngine {
  private graphBuilder: GraphBuilder;
  private queryStats: Map<string, number>;
  private cache: Map<string, { result: QueryResult; timestamp: number }>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(graphBuilder: GraphBuilder) {
    this.graphBuilder = graphBuilder;
    this.queryStats = new Map();
    this.cache = new Map();
  }

  public async executeQuery(query: Query): Promise<QueryResult> {
    const startTime = Date.now();
    try {
      // Check cache
      const cacheKey = this.generateCacheKey(query);
      const cachedResult = this.getCachedResult(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      let result: QueryResult;
      switch (query.type) {
        case 'semantic':
          result = await this.executeSemanticQuery(query);
          break;
        case 'structured':
          result = await this.executeStructuredQuery(query);
          break;
        case 'hybrid':
          result = await this.executeHybridQuery(query);
          break;
        default:
          throw new Error(`Unsupported query type: ${(query as Query).type}`);
      }

      // Update stats
      this.updateQueryStats(query, startTime);

      // Cache result
      this.cacheResult(cacheKey, result);

      return result;
    } catch (error) {
      const queryError: QueryError = {
        code: 'QUERY_EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error during query execution',
        query,
        details: error
      };
      throw queryError;
    }
  }

  private async executeSemanticQuery(query: SemanticQuery): Promise<QueryResult> {
    const { nodes, edges } = this.graphBuilder.getGraphData();
    const matches: QueryMatch[] = [];

    const relevantNodes = nodes.filter(node => 
      this.calculateSemanticRelevance(node, query.query) > 
      (query.options?.similarityThreshold || 0.5)
    );

    for (const node of relevantNodes) {
      const connectedNodes = this.findConnectedNodes(node, edges, 
        query.options?.maxDistance || 2);
      
      const connectedEdges = this.findEdgesBetweenNodes(
        [node, ...connectedNodes],
        edges
      );

      matches.push({
        nodes: [node, ...connectedNodes],
        edges: connectedEdges,
        score: this.calculateSemanticRelevance(node, query.query),
        context: this.extractContext(node)
      });
    }

    return {
      matches: this.rankAndFilterMatches(matches, query.context),
      metadata: {
        totalResults: matches.length,
        executionTime: Date.now(),
        confidence: this.calculateAverageConfidence(matches),
        strategy: 'semantic'
      }
    };
  }

  private async executeStructuredQuery(query: StructuredQuery): Promise<QueryResult> {
    const { nodes, edges } = this.graphBuilder.getGraphData();
    const matches: QueryMatch[] = [];

    const matchingNodes = nodes.filter(node => 
      this.matchesPattern(node, query.patterns.nodes));
    
    for (const node of matchingNodes) {
      const matchingEdges = edges.filter(edge =>
        this.matchesEdgePattern(edge, query.patterns.edges) &&
        (edge.source === node.id || edge.target === node.id)
      );

      const connectedNodes = this.getNodesFromEdges(matchingEdges, nodes);

      matches.push({
        nodes: [node, ...connectedNodes],
        edges: matchingEdges,
        score: 1.0,
        context: this.extractContext(node)
      });
    }

    return {
      matches: this.rankAndFilterMatches(matches, query.context),
      metadata: {
        totalResults: matches.length,
        executionTime: Date.now(),
        confidence: 1.0,
        strategy: 'structured'
      }
    };
  }

  private async executeHybridQuery(query: HybridQuery): Promise<QueryResult> {
    let semanticResults: QueryResult;
    let structuredResults: QueryResult;

    const semanticQuery: SemanticQuery = {
      type: 'semantic',
      query: query.semantic.query,
      options: query.semantic.options,
      context: query.context
    };

    const structuredQuery: StructuredQuery = {
      type: 'structured',
      patterns: query.structured.patterns,
      context: query.context
    };

    if (query.strategy === 'parallel') {
      [semanticResults, structuredResults] = await Promise.all([
        this.executeSemanticQuery(semanticQuery),
        this.executeStructuredQuery(structuredQuery)
      ]);
    } else {
      semanticResults = await this.executeSemanticQuery(semanticQuery);
      structuredResults = await this.executeStructuredQuery(structuredQuery);
    }

    const mergedMatches = this.mergeQueryResults(
      semanticResults.matches,
      structuredResults.matches,
      query.strategy === 'weighted' ? 0.6 : 0.5
    );

    return {
      matches: this.rankAndFilterMatches(mergedMatches, query.context),
      metadata: {
        totalResults: mergedMatches.length,
        executionTime: Date.now(),
        confidence: this.calculateAverageConfidence(mergedMatches),
        strategy: `hybrid-${query.strategy}`
      }
    };
  }

  private calculateSemanticRelevance(node: GraphNode, query: string): number {
    const nodeText = JSON.stringify(node.properties).toLowerCase();
    const queryTerms = query.toLowerCase().split(' ');
    const matchingTerms = queryTerms.filter(term => nodeText.includes(term));
    return matchingTerms.length / queryTerms.length;
  }

  private findConnectedNodes(
    startNode: GraphNode,
    edges: GraphEdge[],
    maxDistance: number
  ): GraphNode[] {
    const visited = new Set<string>([startNode.id]);
    const queue: Array<{ node: GraphNode; distance: number }> = [
      { node: startNode, distance: 0 }
    ];
    const result: GraphNode[] = [];

    while (queue.length > 0) {
      const { node, distance } = queue.shift()!;
      if (distance > maxDistance) continue;

      const connectedEdges = edges.filter(
        edge => edge.source === node.id || edge.target === node.id
      );

      for (const edge of connectedEdges) {
        const nextNodeId = edge.source === node.id ? edge.target : edge.source;
        if (!visited.has(nextNodeId)) {
          visited.add(nextNodeId);
          const nextNode = this.graphBuilder.getNode(nextNodeId);
          if (nextNode) {
            result.push(nextNode);
            queue.push({ node: nextNode, distance: distance + 1 });
          }
        }
      }
    }

    return result;
  }

  private findEdgesBetweenNodes(nodes: GraphNode[], edges: GraphEdge[]): GraphEdge[] {
    const nodeIds = new Set(nodes.map(n => n.id));
    return edges.filter(
      edge => nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );
  }

  private matchesPattern(node: GraphNode, patterns: StructuredQuery['patterns']['nodes']): boolean {
    return patterns.some(pattern => {
      if (pattern.id && pattern.id !== node.id) return false;
      if (pattern.label && pattern.label !== node.label) return false;
      if (pattern.properties) {
        return Object.entries(pattern.properties).every(
          ([key, value]) => node.properties[key] === value
        );
      }
      return true;
    });
  }

  private matchesEdgePattern(edge: GraphEdge, patterns: StructuredQuery['patterns']['edges']): boolean {
    return patterns.some(pattern => {
      if (pattern.source && pattern.source !== edge.source) return false;
      if (pattern.target && pattern.target !== edge.target) return false;
      if (pattern.label && pattern.label !== edge.label) return false;
      if (pattern.properties) {
        return Object.entries(pattern.properties).every(
          ([key, value]) => edge.properties[key] === value
        );
      }
      return true;
    });
  }

  private getNodesFromEdges(edges: GraphEdge[], allNodes: GraphNode[]): GraphNode[] {
    const nodeIds = new Set(edges.flatMap(e => [e.source, e.target]));
    return allNodes.filter(node => nodeIds.has(node.id));
  }

  private rankAndFilterMatches(
    matches: QueryMatch[],
    context?: QueryContext
  ): QueryMatch[] {
    let result = [...matches].sort((a, b) => b.score - a.score);

    if (context?.minConfidence !== undefined) {
      result = result.filter(match => match.score >= context.minConfidence!);
    }

    if (context?.maxResults !== undefined) {
      result = result.slice(0, context.maxResults);
    }

    return result;
  }

  private calculateAverageConfidence(matches: QueryMatch[]): number {
    if (matches.length === 0) return 0;
    return matches.reduce((sum, match) => sum + match.score, 0) / matches.length;
  }

  private extractContext(node: GraphNode): string {
    return `${node.label}: ${node.properties.name || ''} (${node.properties.sourceDocument || ''})`;
  }

  private generateCacheKey(query: Query): string {
    return JSON.stringify(query);
  }

  private getCachedResult(key: string): QueryResult | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result;
    }
    return null;
  }

  private cacheResult(key: string, result: QueryResult): void {
    this.cache.set(key, { result, timestamp: Date.now() });
  }

  private updateQueryStats(query: Query, startTime: number): void {
    const queryType = query.type;
    const executionTime = Date.now() - startTime;
    
    const currentCount = this.queryStats.get(queryType) || 0;
    this.queryStats.set(queryType, currentCount + 1);
  }

  private mergeQueryResults(
    semanticMatches: QueryMatch[],
    structuredMatches: QueryMatch[],
    semanticWeight: number
  ): QueryMatch[] {
    const structuredWeight = 1 - semanticWeight;
    const merged = new Map<string, QueryMatch>();

    semanticMatches.forEach(match => {
      const key = match.nodes.map(n => n.id).sort().join(',');
      merged.set(key, {
        ...match,
        score: match.score * semanticWeight
      });
    });

    structuredMatches.forEach(match => {
      const key = match.nodes.map(n => n.id).sort().join(',');
      const existing = merged.get(key);
      if (existing) {
        existing.score += match.score * structuredWeight;
      } else {
        merged.set(key, {
          ...match,
          score: match.score * structuredWeight
        });
      }
    });

    return Array.from(merged.values());
  }

  public getQueryStats(): QueryStats {
    const totalQueries = Array.from(this.queryStats.values())
      .reduce((sum, count) => sum + count, 0);

    return {
      totalQueries,
      averageExecutionTime: 0,
      successRate: 1.0,
      commonPatterns: Array.from(this.queryStats.entries())
        .map(([pattern, count]) => ({ pattern, count }))
        .sort((a, b) => b.count - a.count)
    };
  }

  public clearCache(): void {
    this.cache.clear();
  }
}
