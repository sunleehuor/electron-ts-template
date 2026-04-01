import type { IDownload } from '@shared/types/download';

export {};

export interface IElectronAPI {
  setBadge: (amount: number) => void;
  onAttachmentStartDownloading: (callback: (payload: IDownload) => any) => void;
  onRemoveAttachmentStartDownloading: (callback: (payload: IDownload) => any) => void;
  onAttachmentCanceled: (callback: (payload: IDownload) => any) => void;
  onRemoveAttachmentCanceled: (callback: (payload: IDownload) => any) => void;
  onAttachmentCompleted: (callback: (payload: IDownload) => any) => void;
  onRemoveAttachmentCompleted: (callback: (payload: IDownload) => any) => void;
  onAttachmentWillCanceled: (id: string) => void;
  saveAsImage: (url: string) => Promise<void>;
  copyImage: (url: Uint8Array | string) => Promise<void>;
  getDeviceId: () => Promise<string>;
  getAppName: () => Promise<string>;
  getAppVersion: () => Promise<string>;
}

export interface IElectronUpdate {
  checkForUpdate: (url: string) => void;
  confirmDownload: (url: string) => void;
  quitAndInstall: () => void;

  onUpdateAvailable: (callback: () => void) => void;
  onUpdateNotAvailable: (callback: () => void) => void;
  onProgress: (callback: (data: IPatchProgressing) => void) => void;
  onDownloaded: (callback: () => void) => void;
  onError: (callback: (data: any) => void) => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
    electronUpdater: IElectronUpdate;
  }
}
