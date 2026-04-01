export type TDownloadStatus = 'processing' | 'downloaded' | 'canceled';

export interface IDownload {
  title: string;
  path: string;
  status: TDownloadStatus;
  url: string;
  id: string;
  downloadAt: Date;
  percent: number;
}
