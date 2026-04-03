export interface IPlatformCheckForUpdate {
  version: number;
  name: string;
}

export type TPlatformUpdateProgressStatus = 'Pending' | 'Downloaded' | 'Failed';

export interface IPlatformUpdateProgress {
  percent: number;
  status: TPlatformUpdateProgressStatus;
}
