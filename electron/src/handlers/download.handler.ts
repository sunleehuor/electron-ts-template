import { ipcMain, session } from 'electron';
import crypto from 'crypto';
import { IDownload } from '@shared/types/download';
import {
  IPC_ON_ATTACHMENT_CANCELED,
  IPC_ON_ATTACHMENT_COMPLETED,
  IPC_ON_ATTACHMENT_START_DOWNLOADING,
  IPC_ON_CANCEL_DOWNLOAD,
} from '@shared/constant/ipc.constant';

const downloads = new Map(); // Store download items by ID

export function initDownloaderHandler() {
  session.defaultSession.on('will-download', async (event, item, webContents) => {
    const uniqueKey = crypto.randomBytes(16).toString('hex');
    const downloadAt = new Date();
    const filename = item.getFilename();
    const url = item.getURL();

    const data: IDownload = {
      title: item.getSavePath()?.split('/')?.[item.getSavePath()?.split('/')?.length - 1] || filename,
      path: item.getSavePath(),
      status: 'processing',
      url,
      id: uniqueKey,
      downloadAt: downloadAt,
      percent: 0,
    };

    downloads.set(uniqueKey, item);
    // Start downloading
    webContents.send(IPC_ON_ATTACHMENT_START_DOWNLOADING, data);

    // Track progress
    item.on('updated', (_, state) => {
      if (state === 'progressing') {
        if (!item.isPaused()) {
          const received = item.getReceivedBytes();
          const total = item.getTotalBytes();
          const percent = total > 0 ? (received / total) * 100 : 0;
          const data: IDownload = {
            title: item.getSavePath()?.split('/')?.[item.getSavePath()?.split('/')?.length - 1] || filename,
            path: item.getSavePath(),
            status: 'processing',
            url,
            id: uniqueKey,
            downloadAt: downloadAt,
            percent: percent,
          };
          console.log('Progressing', percent);
          webContents.send(IPC_ON_ATTACHMENT_START_DOWNLOADING, data);
        }
      }
    });

    // Done
    item.on('done', (_, state) => {
      const data: IDownload = {
        title: item.getSavePath()?.split('/')?.[item.getSavePath()?.split('/')?.length - 1] || filename,
        path: item.getSavePath(),
        status: 'downloaded',
        url,
        id: uniqueKey,
        downloadAt: downloadAt,
        percent: 0,
      };
      downloads.delete(uniqueKey);
      if (state === 'completed') {
        console.log('Completed');
        webContents.send(IPC_ON_ATTACHMENT_COMPLETED, data);
      } else {
        console.log('Canceled');
        webContents.send(IPC_ON_ATTACHMENT_CANCELED, {
          ...data,
          status: 'canceled',
        });
      }
    });
  });

  ipcMain.on(IPC_ON_CANCEL_DOWNLOAD, (_, id) => {
    try {
      const item = downloads.get(id);
      item?.cancel?.();
    } catch (e) {
      console.log(e);
    }
  });
}
