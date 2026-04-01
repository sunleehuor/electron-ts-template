import { contextBridge, ipcRenderer } from 'electron';
import { IDownload } from '@shared/types/download';
import { IPatchProgressing } from '@shared/types/patch';
import {
  IPC_CHECK_FOR_UPDATE,
  IPC_CONFIRM_DOWNLOAD,
  IPC_COPY_IMAGE,
  IPC_GET_APP_VERSION,
  IPC_GET_DEVICE_ID,
  IPC_GET_DEVICE_NAME,
  IPC_ON_ATTACHMENT_CANCELED,
  IPC_ON_ATTACHMENT_COMPLETED,
  IPC_ON_ATTACHMENT_START_DOWNLOADING,
  IPC_ON_CANCEL_DOWNLOAD,
  IPC_QUIT_AND_INSTALL,
  IPC_SAVE_AS_IMAGE,
  IPC_SET_BADGE,
  IPC_UPDATE_AVAILABLE,
  IPC_UPDATE_DOWNLOADED,
  IPC_UPDATE_ERROR,
  IPC_UPDATE_NOT_AVAILABLE,
  IPC_UPDATE_PROGRESS,
} from '@shared/constant/ipc.constant';

contextBridge.exposeInMainWorld('electronAPI', {
  // Badge
  setBadge: (amount: number) => ipcRenderer.invoke(IPC_SET_BADGE, amount),

  // Attachment
  onAttachmentStartDownloading: (callback: (payload: IDownload) => any) =>
    ipcRenderer.on(IPC_ON_ATTACHMENT_START_DOWNLOADING, (_, payload) => callback(payload)),
  onRemoveAttachmentStartDownloading: (callback: (payload: IDownload) => any) =>
    ipcRenderer.removeListener(IPC_ON_ATTACHMENT_START_DOWNLOADING, (_, payload) => callback(payload)),
  onAttachmentCanceled: (callback: (payload: IDownload) => any) =>
    ipcRenderer.on(IPC_ON_ATTACHMENT_CANCELED, (_, payload) => callback(payload)),
  onRemoveAttachmentCanceled: (callback: (payload: IDownload) => any) =>
    ipcRenderer.removeListener(IPC_ON_ATTACHMENT_CANCELED, (_, payload) => callback(payload)),
  onAttachmentCompleted: (callback: (payload: IDownload) => any) =>
    ipcRenderer.on(IPC_ON_ATTACHMENT_COMPLETED, (_, payload) => callback(payload)),
  onRemoveAttachmentCompleted: (callback: (payload: IDownload) => any) =>
    ipcRenderer.removeListener(IPC_ON_ATTACHMENT_COMPLETED, (_, payload) => callback(payload)),
  onAttachmentWillCanceled: (id: string) => ipcRenderer.send(IPC_ON_CANCEL_DOWNLOAD, id),
  saveAsImage: (url: string) => ipcRenderer.invoke(IPC_SAVE_AS_IMAGE, url),
  copyImage: (url: Uint8Array | string) => ipcRenderer.invoke(IPC_COPY_IMAGE, url),

  // Window
  getDeviceId: () => ipcRenderer.invoke(IPC_GET_DEVICE_ID),
  getAppName: () => ipcRenderer.invoke(IPC_GET_DEVICE_NAME),
  getAppVersion: () => ipcRenderer.invoke(IPC_GET_APP_VERSION),
});

// Auto Update
contextBridge.exposeInMainWorld('electronUpdater', {
  checkForUpdate: (url: string) => ipcRenderer.send(IPC_CHECK_FOR_UPDATE, url),
  confirmDownload: (url: string) => ipcRenderer.send(IPC_CONFIRM_DOWNLOAD, url),
  quitAndInstall: () => ipcRenderer.send(IPC_QUIT_AND_INSTALL),

  onUpdateAvailable: (callback: () => void) => ipcRenderer.on(IPC_UPDATE_AVAILABLE, callback),
  onUpdateNotAvailable: (callback: () => void) => ipcRenderer.on(IPC_UPDATE_NOT_AVAILABLE, callback),
  onProgress: (callback: (data: IPatchProgressing) => void) =>
    ipcRenderer.on(IPC_UPDATE_PROGRESS, (_event, data) => callback(data)),
  onDownloaded: (callback: () => void) => ipcRenderer.on(IPC_UPDATE_DOWNLOADED, callback),
  onError: (callback: (data: any) => void) => ipcRenderer.on(IPC_UPDATE_ERROR, (_event, data) => callback(data)),
});
