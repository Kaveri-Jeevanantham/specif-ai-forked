import { ipcMain, dialog } from 'electron';
import { EntityExtractor } from '../knowledge-graph/core/entity-extractor';
import { GraphBuilder } from '../knowledge-graph/core/graph-builder';
import { QueryEngine } from '../knowledge-graph/core/query-engine';
import { PersistenceService } from '../knowledge-graph/services/persistence.service';
import { 
  Query,
  QueryResult,
  SemanticQuery,
  StructuredQuery,
  HybridQuery
} from '../knowledge-graph/types/query.types';
import { ProcessingResult, DocumentMetadata } from '../knowledge-graph/types/entity.types';
import { GraphData } from '../knowledge-graph/types/graph.types';
import { promises as fs } from 'fs';
import { extname } from 'path';

export class KnowledgeGraphHandler {
  private entityExtractor: EntityExtractor;
  private graphBuilder: GraphBuilder;
  private queryEngine: QueryEngine;
  private persistenceService: PersistenceService;

  constructor() {
    this.entityExtractor = new EntityExtractor();
    this.graphBuilder = new GraphBuilder();
    this.queryEngine = new QueryEngine(this.graphBuilder);
    this.persistenceService = new PersistenceService();

    this.initializeIPC();
    this.loadPersistedGraph();
  }

  private async loadPersistedGraph(): Promise<void> {
    try {
      const graphData = await this.persistenceService.loadGraph();
      await this.graphBuilder.clear();
      if (graphData.nodes.length > 0 || graphData.edges.length > 0) {
        await this.graphBuilder.updateGraph({
          type: 'add',
          nodes: graphData.nodes,
          edges: graphData.edges
        });
      }
    } catch (error) {
      console.error('Error loading persisted graph:', error);
    }
  }

  private initializeIPC(): void {
    // Document Processing
    ipcMain.handle('kg:process-document', this.handleProcessDocument.bind(this));
    ipcMain.handle('kg:process-documents', this.handleProcessDocuments.bind(this));
    
    // Querying
    ipcMain.handle('kg:query', this.handleQuery.bind(this));
    ipcMain.handle('kg:semantic-search', this.handleSemanticSearch.bind(this));
    ipcMain.handle('kg:structured-search', this.handleStructuredSearch.bind(this));
    
    // Graph Management
    ipcMain.handle('kg:export', this.handleExport.bind(this));
    ipcMain.handle('kg:import', this.handleImport.bind(this));
    ipcMain.handle('kg:get-stats', this.handleGetStats.bind(this));
    ipcMain.handle('kg:clear', this.handleClear.bind(this));
  }

  public async handleProcessDocument(
    _event: Electron.IpcMainInvokeEvent,
    filePath: string
  ): Promise<ProcessingResult> {
    try {
      const content = await this.readFileContent(filePath);
      const metadata: DocumentMetadata = {
        filename: filePath.split('/').pop() || '',
        type: extname(filePath).toLowerCase(),
        path: filePath,
        processedAt: new Date()
      };

      const result = await this.entityExtractor.extract(content, metadata);
      await this.graphBuilder.addDocument(result);
      await this.persistenceService.saveGraph(this.graphBuilder.getGraphData());

      return result;
    } catch (error) {
      console.error('Error processing document:', error);
      throw error;
    }
  }

  public async handleProcessDocuments(
    _event: Electron.IpcMainInvokeEvent,
    filePaths: string[]
  ): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];
    for (const filePath of filePaths) {
      try {
        const result = await this.handleProcessDocument(_event, filePath);
        results.push(result);
      } catch (error) {
        console.error(`Error processing document ${filePath}:`, error);
      }
    }
    return results;
  }

  public async handleQuery(
    _event: Electron.IpcMainInvokeEvent,
    query: Query
  ): Promise<QueryResult> {
    return this.queryEngine.executeQuery(query);
  }

  public async handleSemanticSearch(
    _event: Electron.IpcMainInvokeEvent,
    params: {
      query: string;
      options?: SemanticQuery['options'];
    }
  ): Promise<QueryResult> {
    const query: SemanticQuery = {
      type: 'semantic',
      query: params.query,
      options: params.options
    };
    return this.queryEngine.executeQuery(query);
  }

  public async handleStructuredSearch(
    _event: Electron.IpcMainInvokeEvent,
    patterns: StructuredQuery['patterns']
  ): Promise<QueryResult> {
    const query: StructuredQuery = {
      type: 'structured',
      patterns
    };
    return this.queryEngine.executeQuery(query);
  }

  public async handleExport(
    _event: Electron.IpcMainInvokeEvent,
    outputPath?: string
  ): Promise<GraphData> {
    try {
      const graphData = this.graphBuilder.getGraphData();
      
      if (outputPath) {
        await this.persistenceService.exportGraph('main', outputPath);
      }

      return graphData;
    } catch (error) {
      console.error('Error exporting graph:', error);
      throw error;
    }
  }

  public async handleImport(
    _event: Electron.IpcMainInvokeEvent
  ): Promise<void> {
    try {
      const { filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });

      if (filePaths.length > 0) {
        await this.persistenceService.importGraph(filePaths[0], 'main');
        await this.loadPersistedGraph();
      }
    } catch (error) {
      console.error('Error importing graph:', error);
      throw error;
    }
  }

  public async handleGetStats(
    _event: Electron.IpcMainInvokeEvent
  ): Promise<{
    graphStats: Awaited<ReturnType<typeof this.persistenceService.getStats>>;
    queryStats: ReturnType<typeof this.queryEngine.getQueryStats>;
  }> {
    const [graphStats, queryStats] = await Promise.all([
      this.persistenceService.getStats(),
      this.queryEngine.getQueryStats()
    ]);

    return {
      graphStats,
      queryStats
    };
  }

  public async handleClear(
    _event: Electron.IpcMainInvokeEvent
  ): Promise<void> {
    await this.graphBuilder.clear();
    await this.persistenceService.saveGraph({ nodes: [], edges: [] });
    this.queryEngine.clearCache();
  }

  private async readFileContent(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  }
}
