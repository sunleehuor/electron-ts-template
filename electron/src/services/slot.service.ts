import Store from 'electron-store';
import { app } from 'electron';
import { acquireLock, releaseLock } from '@/services/lock.service';
import { MAX_INSTANCES } from '@/constant/app.constant';
import log from 'electron-log';

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
