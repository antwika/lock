import { Mutex } from '../src/Mutex';

const sleep = (ms: number) => new Promise((resolve) => {
  setTimeout(() => {
    resolve(true);
  }, ms);
});

describe('Mutex', () => {
  it('does not allow concurrent locks.', async () => {
    const mutex = new Mutex();

    let worker1Active = false;
    let worker2Active = false;

    const worker1 = async () => {
      const releaser = await mutex.acquire();
      worker1Active = true;
      sleep(100);
      expect(worker2Active).toBeFalsy();
      worker1Active = false;
      releaser();
    };
    const worker2 = async () => {
      const releaser = await mutex.acquire();
      worker2Active = true;
      sleep(100);
      expect(worker1Active).toBeFalsy();
      worker2Active = false;
      releaser();
    };

    worker1();
    worker2();
  });
});
