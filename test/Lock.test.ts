import { ConsoleLogger, ILogger } from '@antwika/common';
import { ReadPreferringLockPolicy, WritePreferringLockPolicy } from '../src/LockPolicy';
import { Lock } from '../src/Lock';

const sleep = (ms: number) => new Promise((resolve) => {
  setTimeout(() => {
    resolve(true);
  }, ms);
});

describe('Lock', () => {
  describe('ReadPreferringLockPolicy', () => {
    let logger: ILogger;
    let lock: Lock;

    beforeEach(() => {
      logger = new ConsoleLogger('debug');
      lock = new Lock(logger, new ReadPreferringLockPolicy(logger));
    });

    it('can be locked for reading', async () => {
      await lock.beginRead();
      await lock.endRead();
      expect(lock.getLockCount()).toBe(0);
    });

    it('can be locked for writing', async () => {
      await lock.beginWrite();
      await lock.endWrite();
      expect(lock.getLockCount()).toBe(0);
    });

    it('can not acquire locks for reading and writing at the same time', async () => {
      let readLock = false;
      let writeLock = false;
      await Promise.all([
        async () => {
          await lock.beginRead();
          expect(writeLock).toBeFalsy();
          readLock = true;
          await sleep(100);
          readLock = false;
          expect(writeLock).toBeFalsy();
          await lock.endRead();
        },
        async () => {
          await lock.beginWrite();
          expect(readLock).toBeFalsy();
          writeLock = true;
          await sleep(100);
          writeLock = false;
          expect(readLock).toBeFalsy();
          await lock.endWrite();
        },
      ]);
    });

    it('can be locked for reading, and then locked for writing', async () => {
      await lock.beginRead();
      await lock.endRead();
      await lock.beginWrite();
      await lock.endWrite();
      expect(lock.getLockCount()).toBe(0);
    });

    it('can be locked for writing, and then locked for reading', async () => {
      await lock.beginWrite();
      await lock.endWrite();
      await lock.beginRead();
      await lock.endRead();
      expect(lock.getLockCount()).toBe(0);
    });

    it('allows multiple concurrent readers', async () => {
      await lock.beginRead();
      await lock.beginRead();
      expect(lock.getLockCount()).toBe(2);
      await lock.endRead();
      await lock.endRead();
      expect(lock.getLockCount()).toBe(0);
    });

    it('readers MUST wait until all writers have finished', async () => {
      let writeFinished = false;
      const write = async () => {
        await lock.beginWrite();
        await sleep(1000);
        await lock.endWrite();
        writeFinished = true;
      };

      write();
      await sleep(100);
      expect(writeFinished).toBeFalsy();
      await lock.beginRead();
      expect(writeFinished).toBeTruthy();
      await lock.endRead();
      expect(lock.getLockCount()).toBe(0);
    });
  });

  describe('WritePreferringLockPolicy', () => {
    let logger: ILogger;
    let lock: Lock;

    beforeEach(() => {
      logger = new ConsoleLogger('debug');
      lock = new Lock(logger, new WritePreferringLockPolicy(logger));
    });

    it('can be locked for writing', async () => {
      await lock.beginWrite();
      await lock.endWrite();
      expect(lock.getLockCount()).toBe(0);
    });

    it('can be locked for reading', async () => {
      await lock.beginRead();
      await lock.endRead();
      expect(lock.getLockCount()).toBe(0);
    });

    it('can not acquire locks for reading and writing at the same time', async () => {
      let readLock = false;
      let writeLock = false;
      await Promise.all([
        async () => {
          await lock.beginRead();
          expect(writeLock).toBeFalsy();
          readLock = true;
          await sleep(100);
          readLock = false;
          expect(writeLock).toBeFalsy();
          await lock.endRead();
        },
        async () => {
          await lock.beginWrite();
          expect(readLock).toBeFalsy();
          writeLock = true;
          await sleep(100);
          writeLock = false;
          expect(readLock).toBeFalsy();
          await lock.endWrite();
        },
      ]);
    });

    it('can be locked for writing, and then locked for reading', async () => {
      await lock.beginWrite();
      await lock.endWrite();
      await lock.beginRead();
      await lock.endRead();
      expect(lock.getLockCount()).toBe(0);
    });

    it('can be locked for reading, and then locked for writing', async () => {
      await lock.beginRead();
      await lock.endRead();
      await lock.beginWrite();
      await lock.endWrite();
      expect(lock.getLockCount()).toBe(0);
    });

    it('allows multiple concurrent writers', async () => {
      await lock.beginWrite();
      await lock.beginWrite();
      expect(lock.getLockCount()).toBe(2);
      await lock.endWrite();
      await lock.endWrite();
      expect(lock.getLockCount()).toBe(0);
    });

    it('readers MUST wait until all writers have finished', async () => {
      let readFinished = false;
      const read = async () => {
        await lock.beginRead();
        await sleep(1000);
        await lock.endRead();
        readFinished = true;
      };

      read();
      await sleep(100);
      expect(readFinished).toBeFalsy();
      await lock.beginWrite();
      expect(readFinished).toBeTruthy();
      await lock.endWrite();
      expect(lock.getLockCount()).toBe(0);
    });
  });
});
