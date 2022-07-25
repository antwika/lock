import { ILogger } from '@antwika/common';
import { ILockPolicy } from './LockPolicy';

export class Lock {
  private readonly logger: ILogger;

  private readonly lockPolicy: ILockPolicy;

  constructor(logger: ILogger, lockPolicy: ILockPolicy) {
    this.logger = logger;
    this.lockPolicy = lockPolicy;
  }

  getLockCount() {
    return this.lockPolicy.getLockCount();
  }

  async beginRead() {
    await this.lockPolicy.beginRead();
  }

  async endRead() {
    await this.lockPolicy.endRead();
  }

  async beginWrite() {
    await this.lockPolicy.beginWrite();
  }

  async endWrite() {
    await this.lockPolicy.endWrite();
  }
}
