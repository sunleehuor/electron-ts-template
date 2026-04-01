import type { IDownload } from '@shared/types/download';
import { useEffect } from 'react';

export default function HomePage() {
  function onClick() {
    const api = (window as any).electronAPI;
    api?.setBadge(100);
    api?.getDeviceId();
    api?.getAppName();
    api?.getAppVersion();
  }

  const data = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwmCAGWzGhm5-EUSPdHk6cEo_Pq4qTOFg81Q&s';

  function onCopy() {
    const api = (window as any).electronAPI;
    api?.saveAsImage(data);
  }

  useEffect(() => {
    console.log('asdhjs');
    const api = (window as any)?.electronAPI;
    if (api) {
      api?.onAttachmentStartDownloading((payload: IDownload) => {
        console.log(payload);
      });
    }
  }, []);

  return (
    <>
      <img src={data} onClick={onCopy} />
      <span onClick={onClick}>Home Pagesssasdjgasdgashg</span>
    </>
  );
}
