import { app, BrowserWindow, nativeImage } from 'electron';

let winRef: BrowserWindow | null = null;

export function initBadgeService(win: BrowserWindow | null) {
  if (!win) return;
  winRef = win;
}

function createOverlayIcon(amount: number = 0) {
  if (amount <= 0) return null;

  const label = amount > 99 ? '99+' : String(amount);
  const width = amount > 99 ? 48 : 32;
  const height = 32;
  const cx = width / 2;
  const shape =
    amount > 99
      ? `<rect x="0" y="0" width="${width}" height="${height}" rx="16" ry="16" fill="red"/>`
      : `<circle cx="${cx}" cy="16" r="16" fill="red"/>`;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      ${shape}
      <text
        x="${cx}" y="16"
        font-family="sans-serif"
        font-size="16"
        font-weight="bold"
        fill="white"
        text-anchor="middle"
        dominant-baseline="central"
      >${label}</text>
    </svg>
  `;

  return nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`);
}

export function setBadge(amount: number = 0) {
  amount = Math.min(amount, 9999);

  if (process.platform === 'win32') {
    const overlay = createOverlayIcon(amount);
    winRef?.setOverlayIcon?.(overlay, amount > 0 ? `${amount}` : '');
  } else if (process.platform === 'darwin') {
    app.setBadgeCount(amount);
  } else if (process.platform === 'linux') {
    const success = app.setBadgeCount(amount);
    console.log('[Badge] Linux badge supported?', success);
  }
}
