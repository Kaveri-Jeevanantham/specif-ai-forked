import { FILTER_STRINGS } from '../../constants/app.constants';

export class GetProjectListAction {
  static readonly type = '[Projects] Get Project List';

  constructor() {}
}

export class CreateProject {
  static readonly type = '[Projects] Create Project';

  constructor(
    public projectName: string,
    public metadata: any,
  ) {}
}

export class GetProjectFiles {
  static readonly type = '[Projects] Get Project Files';

  constructor(
    public projectId: string,
    public filterString: string = FILTER_STRINGS.BASE,
  ) {}
}

export class ReadFile {
  static readonly type = '[Projects] Read File';

  constructor(public path: string) {}
}

export class BulkReadFiles {
  static readonly type = '[Projects] Bulk Read Files';

  constructor(
    public key: string,
    public filterString: string = FILTER_STRINGS.BASE,
  ) {}
}

export class ArchiveFile {
  static readonly type = '[Projects] ArchiveFile File';

  constructor(public path: string) {}
}

export class CreateFile {
  static readonly type = '[Projects] Create File';

  constructor(
    public path: string,
    public content: any,
    public featureFile: string = '',
  ) {}
}

export class UpdateFile {
  static readonly type = '[Projects] Update File';

  constructor(
    public path: string,
    public content: any,
  ) {}
}

export class FileExists {
  static readonly type = '[Projects] File Exists';

  constructor(public path: string) {}
}

export class UpdateMetadata {
  static readonly type = '[Projects] Update Metadata';

  constructor(
    public projectId: string,
    public newMetadata: any,
  ) {}
}

export class ClearBRDPRDState {
  static readonly type = '[Projects] Clear BRD and PRD State';
}