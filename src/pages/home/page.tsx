export default function HomePage() {
  const url = 'http://localhost:9000/maok/updates/';

  async function checkForUpdate() {
    const res = await window.electronPlatformUpdater.checkForUpdate(url + 'updates.json');
    console.log(res);
  }

  async function confirmDownload() {
    const res = await window.electronPlatformUpdater.confirmDownload(url + 'update.zip');
  }

  async function quiteAndInstall() {
    try {
      const res = await window.electronPlatformUpdater.quitAndInstall();
      console.log(res);
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <div>
      <div>
        <button onClick={checkForUpdate}>Check for download</button>
      </div>
      <div>
        <button onClick={confirmDownload}>Confirm download</button>
      </div>
      <div>
        <button onClick={quiteAndInstall}>Quit and install</button>
      </div>
    </div>
  );
}
