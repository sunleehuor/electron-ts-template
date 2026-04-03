export interface IPlatformCheckForUpdate {
  version: string;
  name: string;
}

export type TPlatformUpdateProgressStatus = 'Pending' | 'Downloaded' | 'Failed';

export interface IPlatformUpdateProgress {
  percent: number;
  status: TPlatformUpdateProgressStatus;
}
