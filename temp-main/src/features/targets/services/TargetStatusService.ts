import { store } from '@app/store';
import type { RootState } from '@app/store';
import { TargetStateString } from '@/enums/target.enum';
import { removeTarget, type Target } from '../store/targetsSlice';
import { TARGET_STATUS_POLL_INTERVAL_MS } from '../config/targetRuntime.config';

export class TargetStatusService {
  private static instance: TargetStatusService | null = null;

  private intervalRef: ReturnType<typeof setInterval> | null = null;

  private isRunning = false;

  private constructor() {}

  static getInstance(): TargetStatusService {
    if (!TargetStatusService.instance) {
      TargetStatusService.instance = new TargetStatusService();
    }
    return TargetStatusService.instance;
  }

  static resetInstance(): void {
    if (TargetStatusService.instance) {
      TargetStatusService.instance.stop();
      TargetStatusService.instance = null;
    }
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.intervalRef = setInterval(() => {
      this.evaluateTargets();
    }, TARGET_STATUS_POLL_INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalRef !== null) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
    }
    this.isRunning = false;
  }

  isActive(): boolean {
    return this.isRunning;
  }

  private evaluateTargets(): void {
    const state = store.getState() as RootState;
    const settings = state.settings;
    const removeTimeoutMs = settings.disconnectedTargetTimeoutSec * 1000;
    const now = Date.now();

    const targetsToRemove = state.targets.allIds.filter((id) => {
      const target = state.targets.byId[id];
      if (!target?.lastUpdate) return false;
      return now - target.lastUpdate > removeTimeoutMs;
    });

    targetsToRemove.forEach((id) => {
      store.dispatch(removeTarget(id));
    });
  }

  static isTargetInactive(target: Target, state?: RootState): boolean {
    const root = state ?? (store.getState() as RootState);
    const timeoutMs = root.settings.inactiveTargetTimeoutSec * 1000;
    const now = Date.now();
    if (!target.lastUpdate) return false;
    return now - target.lastUpdate > timeoutMs && target.status !== TargetStateString.destroyed;
  }

  static shouldRemoveTarget(target: Target, state?: RootState): boolean {
    const root = state ?? (store.getState() as RootState);
    const timeoutMs = root.settings.disconnectedTargetTimeoutSec * 1000;
    const now = Date.now();
    if (!target.lastUpdate) return false;
    return now - target.lastUpdate > timeoutMs;
  }
}
