export interface IList{
  folderName: string
  fileName: string
  content: IProjectDocument
}

export interface IProjectDocument {
  requirement?: string;
  title?: string;
  features?: IFeature[];
}

export interface IFeature {
  id?: string;
  name?: string;
  description?: string;
  tasks?: ITask[];
}

export interface ITask {
  list?: string;
  acceptance?: string;
  id?: string;
  chatHistory?: [];
}