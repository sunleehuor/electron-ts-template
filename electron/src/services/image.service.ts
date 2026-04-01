import { app, BrowserWindow, clipboard, nativeImage, shell } from 'electron';
import { isFullUrl } from '@/utils/utils';

// Static
const defaultFolder = app.getPath('downloads');

async function saveAsImage(win: BrowserWindow, fileUrl: string) {
  try {
    win.webContents.downloadURL(fileUrl);
  } catch (err) {
    console.error(`❌ Download failed "${fileUrl}" :`, err);
    throw err;
  }
}

async function copyImage(fileUrl: Uint8Array | string) {
  try {
    let cleanUrl: Uint8Array | URL | string = fileUrl;
    let originalName: Uint8Array | URL | string = cleanUrl;
    let buffer = fileUrl;

    if (fileUrl instanceof Uint8Array) {
      buffer = fileUrl;
    } else if (isFullUrl(fileUrl)) {
      cleanUrl = new URL(fileUrl);
      originalName = new URL(cleanUrl);
      originalName.search = '';
      originalName.hash = '';
    }

    if (!(fileUrl instanceof Uint8Array)) {
      const data = await fetch(cleanUrl.toString());
      buffer = Buffer.from(await data.arrayBuffer());
    }

    const image = nativeImage.createFromBuffer(buffer as Buffer<ArrayBufferLike>);
    clipboard.writeImage(image);
    console.log(`✅ Image copied to clipboard`);
  } catch (err) {
    console.error(`❌ Download failed :`, err);
    throw err;
  }
}

async function onOpenFolder(path: string) {
  try {
    await shell?.showItemInFolder?.(path);
  } catch (e) {
    throw e;
  }
}

module.exports = {
  saveAsImage,
  copyImage,
  onOpenFolder,
};
