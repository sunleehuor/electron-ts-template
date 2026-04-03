import type { IDownload } from '@shared/types/download';
import type { IPlatformCheckForUpdate } from '@shared/types/platformUpdate';
import type { IStorage } from '@shared/types/storage';

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
  slot: ISlot;
  storage: IStorageEvent;
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

export interface IStorageEvent {
  set: (data: IStorage) => Promise<void>;
  get: () => Promise<Partial<IStorage>>;
  update: (partial: Partial<IStorage>) => Promise<void>;
  deleteKey: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

export interface ISlot {
  getId: () => Promise<number | null>;
}

export interface IElectronPlatformUpdater {
  checkForUpdate: (url: string) => Promise<Partial<IPlatformCheckForUpdate> | null>;
  confirmDownload: (url: string) => Promise<vois>;
  quitAndInstall: () => Promise<void>;

  onProgress: (callback: (data: IPlatformUpdateProgress) => void) => void;
  onDownloaded: (callback: () => void) => void;
  onError: (callback: (data: any) => void) => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
    electronUpdater: IElectronUpdate;
    electronPlatformUpdater: IElectronPlatformUpdater;
  }
}
