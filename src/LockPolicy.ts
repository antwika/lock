/* eslint-disable max-classes-per-file */
import { ILogger } from '@antwika/common';
import { Mutex } from './Mutex';

export interface ILockPolicy {
  getLockCount: () => number;
  beginRead(): Promise<void>;
  endRead(): Promise<void>;
  beginWrite(): Promise<void>;
  endWrite(): Promise<void>;
}

export abstract class LockPolicy implements ILockPolicy {
  protected logger: ILogger;

  protected readLock: Mutex;

  protected readLockReleaser?: () => void;

  protected writeLock: Mutex;

  protected writeLockReleaser?: () => void;

  protected counter: number;

  constructor(logger: ILogger) {
    this.logger = logger;
    this.readLock = new Mutex();
    this.writeLock = new Mutex();
    this.counter = 0;
  }

  getLockCount() {
    return this.counter;
  }

  abstract beginRead(): Promise<void>;

  abstract endRead(): Promise<void>;

  abstract beginWrite(): Promise<void>;

  abstract endWrite(): Promise<void>;
}

export class ReadPreferringLockPolicy extends LockPolicy {
  async beginRead() {
    this.readLockReleaser = await this.readLock.acquire();
    this.counter += 1;
    if (this.counter === 1) {
      this.writeLockReleaser = await this.writeLock.acquire();
    }
    this.readLockReleaser();
  }

  async endRead() {
    this.readLockReleaser = await this.readLock.acquire();
    this.counter -= 1;
    if (this.counter === 0) {
      if (this.writeLockReleaser) {
        this.writeLockReleaser();
      }
    }
    this.readLockReleaser();
  }

  async beginWrite() {
    this.writeLockReleaser = await this.writeLock.acquire();
  }

  async endWrite() {
    if (this.writeLockReleaser) {
      this.writeLockReleaser();
    }
  }
}

export class WritePreferringLockPolicy extends LockPolicy {
  async beginRead() {
    this.readLockReleaser = await this.readLock.acquire();
  }

  async endRead() {
    if (this.readLockReleaser) {
      this.readLockReleaser();
    }
  }

  async beginWrite() {
    this.writeLockReleaser = await this.writeLock.acquire();
    this.counter += 1;
    if (this.counter === 1) {
      this.readLockReleaser = await this.readLock.acquire();
    }
    this.writeLockReleaser();
  }

  async endWrite() {
    this.writeLockReleaser = await this.writeLock.acquire();
    this.counter -= 1;
    if (this.counter === 0) {
      if (this.readLockReleaser) {
        this.readLockReleaser();
      }
    }
    this.writeLockReleaser();
  }
}
