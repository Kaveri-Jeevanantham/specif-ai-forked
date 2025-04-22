import { promises as fs } from 'fs';
import { join } from 'path';
import { GraphData, GraphPersistenceOptions } from '../types/graph.types';
import { app } from 'electron';

export class PersistenceService {
  private basePath: string;
  private options: GraphPersistenceOptions;

  constructor(options?: Partial<GraphPersistenceOptions>) {
    this.options = {
      format: 'json',
      path: join(app.getPath('userData'), 'knowledge-graph'),
      compression: true,
      backup: true,
      ...options
    };
    this.basePath = this.options.path;
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
    } catch (error) {
      console.error('Error creating directory:', error);
      throw error;
    }
  }

  public async saveGraph(data: GraphData, identifier: string = 'main'): Promise<void> {
    try {
      const filename = `${identifier}.json`;
      const filePath = join(this.basePath, filename);

      // Create backup if enabled
      if (this.options.backup) {
        await this.createBackup(filePath);
      }

      // Prepare data for storage
      const serializedData = JSON.stringify(data, null, 2);

      // Save the data
      await fs.writeFile(filePath, serializedData, 'utf8');

      console.log(`Graph saved successfully to ${filePath}`);
    } catch (error) {
      console.error('Error saving graph:', error);
      throw error;
    }
  }

  public async loadGraph(identifier: string = 'main'): Promise<GraphData> {
    try {
      const filename = `${identifier}.json`;
      const filePath = join(this.basePath, filename);

      // Read and parse the data
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data) as GraphData;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // Return empty graph if file doesn't exist
        return { nodes: [], edges: [] };
      }
      console.error('Error loading graph:', error);
      throw error;
    }
  }

  private async createBackup(filePath: string): Promise<void> {
    try {
      const fileExists = await fs.access(filePath)
        .then(() => true)
        .catch(() => false);

      if (fileExists) {
        const backupPath = `${filePath}.backup`;
        await fs.copyFile(filePath, backupPath);
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      // Don't throw error for backup failures
    }
  }

  public async listGraphs(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.basePath);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      console.error('Error listing graphs:', error);
      return [];
    }
  }

  public async deleteGraph(identifier: string): Promise<void> {
    try {
      const filename = `${identifier}.json`;
      const filePath = join(this.basePath, filename);

      // Create backup before deletion if enabled
      if (this.options.backup) {
        await this.createBackup(filePath);
      }

      await fs.unlink(filePath);
      console.log(`Graph ${identifier} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting graph ${identifier}:`, error);
      throw error;
    }
  }

  public async exportGraph(identifier: string, exportPath: string): Promise<void> {
    try {
      const sourceFile = join(this.basePath, `${identifier}.json`);
      await fs.copyFile(sourceFile, exportPath);
      console.log(`Graph exported successfully to ${exportPath}`);
    } catch (error) {
      console.error('Error exporting graph:', error);
      throw error;
    }
  }

  public async importGraph(importPath: string, identifier: string): Promise<void> {
    try {
      // Validate the imported file
      const data = await fs.readFile(importPath, 'utf8');
      const graphData = JSON.parse(data) as GraphData;

      // Verify the structure
      if (!this.isValidGraphData(graphData)) {
        throw new Error('Invalid graph data structure');
      }

      // Save the imported data
      await this.saveGraph(graphData, identifier);
      console.log(`Graph imported successfully as ${identifier}`);
    } catch (error) {
      console.error('Error importing graph:', error);
      throw error;
    }
  }

  private isValidGraphData(data: any): data is GraphData {
    return (
      data &&
      Array.isArray(data.nodes) &&
      Array.isArray(data.edges) &&
      data.nodes.every((node: any) =>
        node.id && typeof node.id === 'string' &&
        node.label && typeof node.label === 'string'
      ) &&
      data.edges.every((edge: any) =>
        edge.id && typeof edge.id === 'string' &&
        edge.source && typeof edge.source === 'string' &&
        edge.target && typeof edge.target === 'string'
      )
    );
  }

  public async getStats(): Promise<{
    totalGraphs: number;
    totalSize: number;
    lastModified: Date;
  }> {
    try {
      const graphs = await this.listGraphs();
      let totalSize = 0;
      let lastModified = new Date(0);

      for (const graph of graphs) {
        const filePath = join(this.basePath, `${graph}.json`);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
        if (stats.mtime > lastModified) {
          lastModified = stats.mtime;
        }
      }

      return {
        totalGraphs: graphs.length,
        totalSize,
        lastModified
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  }
}
