import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import { 
  Query,
  SemanticQuery,
  StructuredQuery,
  QueryResult
} from './knowledge-graph/types/query.types';
import { ProcessingResult } from './knowledge-graph/types/entity.types';

type IpcListener = (event: IpcRendererEvent, ...args: any[]) => void;

const electronListeners = {
  openFile: () => ipcRenderer.invoke("dialog:openFile"),
  saveFile: (
    fileContent: string,
    filePath: { rootPath: string; fileName: string } | null
  ) => ipcRenderer.invoke("dialog:saveFile", fileContent, filePath),
  openDirectory: () => ipcRenderer.invoke("dialog:openDirectory"),
  getStoreValue: (key: string) => ipcRenderer.invoke("store-get", key),
  setStoreValue: (key: string, value: any) =>
    ipcRenderer.invoke("store-set", key, value),
  removeStoreValue: (key: string) =>
    ipcRenderer.invoke("removeStoreValue", key),
  loadURL: (serverConfig: string) => ipcRenderer.send("load-url", serverConfig),
  invoke: (channel: string, ...args: any[]) =>
    ipcRenderer.invoke(channel, ...args),
  send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
  on: (channel: string, listener: IpcListener) =>
    ipcRenderer.on(channel, listener),
  once: (channel: string, listener: IpcListener) =>
    ipcRenderer.once(channel, listener),
  removeListener: (channel: string, listener: IpcListener) =>
    ipcRenderer.removeListener(channel, listener),
};

const coreListeners = {
  getSuggestions: (data: any) =>
    ipcRenderer.invoke("core:getSuggestions", data),
  verifyLLMConfig: (provider: string, config: Record<string, any>) =>
    ipcRenderer.invoke("core:verifyLLMConfig", { provider, config }),
  getAppConfig: () => ipcRenderer.invoke("core:getAppConfig"),
};

const requirementListeners = {
  updateRequirement: (data: any) =>
    ipcRenderer.invoke("requirement:update", data),
  chatUpdateRequirement: (data: any) =>
    ipcRenderer.invoke("requirement:chat", data),
  addRequirement: (data: any) =>
    ipcRenderer.invoke("requirement:add", data),
  addBusinessProcess: (data: any) =>
    ipcRenderer.invoke("requirement:bp-add", data),
  updateBusinessProcess: (data: any) =>
    ipcRenderer.invoke("requirement:bp-update", data),
};

const featureListeners = {
  createStories: (data: any) =>
    ipcRenderer.invoke("story:create", data),
  updateStory: (data: any) =>
    ipcRenderer.invoke("story:update", data),
  chatUserStoryTask: (data: any) =>
    ipcRenderer.invoke("story:chat", data),
  addUserStory: (data: any) =>
    ipcRenderer.invoke("story:add", data),
  createTask: (data: any) =>
    ipcRenderer.invoke("task:create", data),
  addTask: (data: any) =>
    ipcRenderer.invoke("task:add", data),
};

const visualizationListeners = {
  createFlowchart: (data: any) =>
    ipcRenderer.invoke("visualization:flowchart", data),
};

const solutionListeners = {
  createSolution: (data: any) =>
    ipcRenderer.invoke("solution:createSolution", data),
};

const appAutoUpdaterListeners = {
  checkForUpdates: () =>
    ipcRenderer.invoke("app-updater:check-for-updates"),
  downloadUpdates: (data: any) =>
    ipcRenderer.invoke("app-updater:download-updates", data)
};

// Knowledge Graph API
const knowledgeGraphListeners = {
  // Document Processing
  processDocument: (filePath: string): Promise<ProcessingResult> => 
    ipcRenderer.invoke('kg:process-document', filePath),
  
  processDocuments: (filePaths: string[]): Promise<ProcessingResult[]> => 
    ipcRenderer.invoke('kg:process-documents', filePaths),
  
  // Querying
  query: (query: Query): Promise<QueryResult> => 
    ipcRenderer.invoke('kg:query', query),
  
  semanticSearch: (params: {
    query: string;
    options?: SemanticQuery['options'];
  }): Promise<QueryResult> => 
    ipcRenderer.invoke('kg:semantic-search', params),
  
  structuredSearch: (patterns: StructuredQuery['patterns']): Promise<QueryResult> => 
    ipcRenderer.invoke('kg:structured-search', patterns),
  
  // Graph Management
  exportGraph: (): Promise<string | undefined> => 
    ipcRenderer.invoke('kg:export'),
  
  importGraph: (): Promise<void> => 
    ipcRenderer.invoke('kg:import'),
  
  getStats: (): Promise<{
    graphStats: {
      totalGraphs: number;
      totalSize: number;
      lastModified: Date;
    };
    queryStats: {
      totalQueries: number;
      averageExecutionTime: number;
      successRate: number;
      commonPatterns: Array<{
        pattern: string;
        count: number;
      }>;
    };
  }> => ipcRenderer.invoke('kg:get-stats'),
  
  clear: (): Promise<void> => 
    ipcRenderer.invoke('kg:clear')
};

const electronAPI = {
  ...electronListeners,
  ...coreListeners,
  ...requirementListeners,
  ...solutionListeners,
  ...visualizationListeners,
  ...featureListeners,
  ...appAutoUpdaterListeners,
  ...knowledgeGraphListeners
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}

export type ElectronAPI = typeof electronAPI;
