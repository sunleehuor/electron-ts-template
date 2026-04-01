import { app, BrowserWindow } from 'electron';
import { initHandler } from '@/handlers/handler';
import { initService } from '@/services/service';
import { createSplashWindow, createWindow, doAfterSplashScreen } from '@/services/screen.service';

let mainWindow: BrowserWindow | null = null;

async function bootstrap() {
  // Splash screen
  const splash = createSplashWindow();

  await doAfterSplashScreen();

  // Close splash screen
  splash.close();

  // Create main screen window
  mainWindow = createWindow();

  // Init service
  initService(mainWindow!);

  // Init handler
  initHandler(mainWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}

// App lifecycle
app.on('ready', bootstrap);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
