import { machineId } from 'node-machine-id';
import { APP_NAME, APP_VERSION } from '@/constant/app.constant';

export async function getMachineIdentifier() {
  try {
    // Pass `true` to get the original (non-hashed) machine ID
    const id = await machineId(true);
    console.log('Machine ID:', id);
    return id;
  } catch (error) {
    console.error('Error getting machine ID:', error);
    return null;
  }
}

export async function getAppName() {
  try {
    const name = APP_NAME;
    console.log('App name: ', name);
    return name;
  } catch (e) {
    throw e;
  }
}

export async function getAppVersion() {
  try {
    const version = APP_VERSION;
    console.log('App version: ', version);
    return version;
  } catch (e) {
    throw e;
  }
}
