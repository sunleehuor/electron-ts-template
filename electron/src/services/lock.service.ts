import { readFileSync, existsSync, writeFileSync, unlinkSync } from 'fs';
import * as path from 'path';
import { app } from 'electron';
import log from 'electron-log';
import { wait } from '@/utils/utils';

const LOCK_FILE = path.join(app.getPath('userData'), 'slots.lock');
const TIMEOUT = 5000;
const INTERVAL = 50;

interface LockData {
  pid: number;
  timestamp: number;
}

function readLock(): LockData | null {
  try {
    return JSON.parse(readFileSync(LOCK_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

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

function isLockStale(): boolean {
  const data = readLock();
  if (!data) return true;
  return !isProcessAlive(data.pid);
}

function isLockTooOld(): boolean {
  const data = readLock();
  if (!data) return true;
  return Date.now() - data.timestamp > 10_000;
}

export function cleanStaleLock(): void {
  if (!existsSync(LOCK_FILE)) return;
  if (isLockStale() || isLockTooOld()) {
    releaseLock();
    log.warn('[Lock] Removed stale lock on startup');
  }
}

export function releaseLock(): void {
  try {
    unlinkSync(LOCK_FILE);
  } catch {
    // already removed
  }
}

export async function acquireLock(): Promise<void> {
  const start = Date.now();

  while (true) {
    try {
      writeFileSync(LOCK_FILE, JSON.stringify({ pid: process.pid, timestamp: Date.now() }), { flag: 'wx' });
      return;
    } catch {
      if (isLockStale() || isLockTooOld()) {
        releaseLock();
        continue;
      }
      if (Date.now() - start > TIMEOUT) {
        throw new Error('[Lock] Timeout waiting for lock');
      }
      await wait(INTERVAL);
    }
  }
}
