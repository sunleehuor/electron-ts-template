import Store from 'electron-store';
import { app, safeStorage } from 'electron';
import log from 'electron-log';
import { IStorage } from '@shared/types/storage';

interface StorageSlot {
  payload: IStorage;
  encrypted: boolean;
}

type StorageStore = {
  slots: Record<number, StorageSlot>;
};

const store = new Store<StorageStore>({
  name: 'storage',
  cwd: app.getPath('userData'),
  defaults: { slots: {} },
}) as any; // Electron store v11.* not support type

function canEncrypt(): boolean {
  return safeStorage.isEncryptionAvailable();
}

function encrypt(data: Record<string, any>): string {
  const json = JSON.stringify(data);
  if (canEncrypt()) {
    return safeStorage.encryptString(json).toString('base64');
  }
  return json;
}

function decrypt<T>(payload: string, encrypted: boolean): T | null {
  try {
    if (encrypted && canEncrypt()) {
      const decrypted = safeStorage.decryptString(Buffer.from(payload, 'base64'));
      return JSON.parse(decrypted) as T;
    }
    return JSON.parse(payload) as T;
  } catch {
    log.error('[Storage] Failed to decrypt payload');
    return null;
  }
}

export function storageSet(slotId: number, data: Partial<IStorage>): void {
  store.set(`slots.${slotId}`, {
    payload: encrypt(data),
    encrypted: canEncrypt(),
  });
  log.info(`[Storage] Set slot: ${slotId}`);
}

export function storageGet(slotId: number): Partial<IStorage> {
  const slot = store.get(`slots.${slotId}`);
  if (!slot?.payload) return {};
  console.log(decrypt<IStorage>(slot.payload, slot.encrypted) || {});
  return decrypt<IStorage>(slot.payload, slot.encrypted) || {};
}

export function storageUpdate(slotId: number, partial: Partial<IStorage>): void {
  const current = storageGet(slotId) ?? {};
  storageSet(slotId, { ...current, ...partial });
  log.info(`[Storage] Updated slot: ${slotId}`);
}

export function storageDeleteKey(slotId: number, key: keyof IStorage): void {
  const current = storageGet(slotId) ?? {};
  if (Object.keys(current).length) delete current[key];
  storageSet(slotId, current);
  log.info(`[Storage] Deleted key: ${key} from slot: ${slotId}`);
}

export function storageClear(slotId: number): void {
  store.set(`slots.${slotId}`, {
    payload: null,
    encrypted: false,
  });
  log.info(`[Storage] Cleared slot: ${slotId}`);
}

export function storageClearAll(): void {
  store.set('slots', {});
  log.info('[Storage] Cleared all slots');
}
