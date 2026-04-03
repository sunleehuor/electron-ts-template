export interface IPlatformCheckForUpdate {
  version: string;
  name: string;
}

export interface IPlatformUpdateProgress {
  percent: number;
  status: '';
}
