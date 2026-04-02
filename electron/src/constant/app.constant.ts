import { app } from 'electron';

export const IS_DEV = !app.isPackaged;
export const APP_VERSION = app.getVersion();
export const APP_NAME = app.getName();
export const MAX_INSTANCES = 10;
