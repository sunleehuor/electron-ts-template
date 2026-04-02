import { APP_CACHE_SIZE, MAX_INSTANCES } from '@/constant/app.constant';
import { acquireLock, releaseLock } from '@/services/lock.service';
import { app, session } from 'electron';
import log from 'electron-log';
import Store from 'electron-store';

interface SlotData {
  status: 'active' | 'inactive';
  pid: number | null;
}

type SlotStore = {
  slots: Record<number, SlotData>;
};

const defaultSlots = Object.fromEntries(
  Array.from({ length: MAX_INSTANCES }, (_, i) => [i + 1, { status: 'inactive', pid: null } as SlotData])
);

const slotStore = new Store<SlotStore>({
  name: 'slots',
  cwd: app.getPath('userData'),
  defaults: { slots: defaultSlots },
}) as any; // Electron store v11.* not support type

function isProcessAlive(pid: number | null): boolean {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e: any) {
    if (e.code === 'EPERM') return true;
    return false;
  }
}

export async function acquireSlot(): Promise<number | null> {
  await acquireLock();

  try {
    const slots = slotStore.get('slots');

    for (let i = 1; i <= MAX_INSTANCES; i++) {
      const slot = slots[i];
      if (slot.status === 'inactive' || !isProcessAlive(slot.pid)) {
        slotStore.set(`slots.${i}`, {
          status: 'active',
          pid: process.pid,
        });
        log.info(`[Slot] Acquired slot: ${i}`);
        return i;
      }
    }

    log.warn('[Slot] All slots full');
    return null;
  } finally {
    releaseLock();
  }
}

export function releaseSlot(slotId: number): void {
  slotStore.set(`slots.${slotId}`, {
    status: 'inactive',
    pid: null,
  });
  log.info(`[Slot] Released slot: ${slotId}`);
}

export async function clearSlotCacheIfLarge(slotId: number): Promise<void> {
  const s = session.fromPartition(`persist:slot-${slotId}`);
  const cacheSize = await s.getCacheSize();

  log.info(`[Cache] Slot ${slotId}: ${(cacheSize / 1024 / 1024).toFixed(2)}MB`);

  if (cacheSize > APP_CACHE_SIZE) {
    await s.clearCache(); // ← HTTP/GPU/Code cache only ✅
    log.info(`[Cache] Cleared oversized cache slot: ${slotId}`);
  }
}
