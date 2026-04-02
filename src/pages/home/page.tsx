import type { IDownload } from '@shared/types/download';
import { useEffect } from 'react';

export default function HomePage() {
  async function onClick() {
    const api = window.electronAPI;
    api?.setBadge(100);
    const id = await api?.getDeviceId();
    const name = await api?.getAppName();
    const version = await api?.getAppVersion();
    console.log(id, name, version);
  }

  const data = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwmCAGWzGhm5-EUSPdHk6cEo_Pq4qTOFg81Q&s';

  function onCopy() {
    const api = window.electronAPI;
    api?.saveAsImage(data);
  }

  function setTest() {
    const api = window.electronAPI.storage;
    api.update({
      refreshToken: 'maok 1',
      token: 'maok 1',
    });
  }

  async function getTest() {
    const api = window.electronAPI.storage;
    return await api.get();
  }

  useEffect(() => {
    const api = window?.electronAPI;
    if (api) {
      api?.onAttachmentStartDownloading((payload: IDownload) => {
        console.log(`Progresing ${payload.id} :`, payload.percent);
      });
      api?.onAttachmentCompleted((payload: IDownload) => {
        console.log(`Completed ${payload.id}`);
      });
    }

    (async () => {
      const res = await getTest();
      console.log(res);
    })();

    return () => {
      api.onRemoveAttachmentCompleted(() => {});
      api.onRemoveAttachmentStartDownloading(() => {});
    };
  }, []);

  useEffect(() => {
    const api = window?.electronUpdater;
    if (api) {
      api.onProgress((e) => {
        console.log(e);
      });

      api.onDownloaded(() => {
        console.log('Downloaded');
      });

      api.onUpdateAvailable(() => {
        console.log('Available to update');
      });

      api.onUpdateNotAvailable(() => {
        console.log('Not available to update');
      });
    }
  }, []);

  return (
    <>
      <img src={data} onClick={onCopy} />
      <br />
      <span onClick={onClick}>Home Pagesssasdjgasdgashg</span>
      <br />
      <button onClick={() => setTest()}>Set</button>
      <br />
      <button onClick={() => window.electronUpdater.checkForUpdate('http://localhost:9001/browser/maok/')}>
        Check for update
      </button>
      <br />
      <button onClick={() => window.electronUpdater.confirmDownload('http://localhost:9001/browser/maok/')}>
        Update
      </button>
      <br />
      <button onClick={() => window.electronUpdater.quitAndInstall()}>Quit and install</button>
    </>
  );
}
