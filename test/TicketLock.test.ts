import { ConsoleLogger, ILogger } from '@antwika/common';
import { MemoryStore } from '@antwika/store';
import { Lock } from '../src/Lock';
import { ReadPreferringLockPolicy } from '../src/LockPolicy';
import { TicketLock } from '../src/TicketLock';

describe('TicketLock', () => {
  let logger: ILogger;
  let lock: Lock;
  let ticketLock: TicketLock;

  beforeEach(() => {
    logger = new ConsoleLogger('debug');
    lock = new Lock(logger, new ReadPreferringLockPolicy(logger));
    ticketLock = new TicketLock(logger, lock, new MemoryStore());
  });

  it('can deliver and accept returning of READ tickets', async () => {
    const ticketId = await ticketLock.acquireTicket('READ');
    await expect(ticketLock.returnTicket(ticketId)).resolves.toBeUndefined();
  });

  it('can deliver and accept returning of WRITE tickets', async () => {
    const ticketId = await ticketLock.acquireTicket('WRITE');
    await expect(ticketLock.returnTicket(ticketId)).resolves.toBeUndefined();
  });

  it('rejects requests for tickets on invalid type', async () => {
    const tickets = new MemoryStore();
    const aTicketLock = new TicketLock(logger, lock, tickets);
    await expect(() => aTicketLock.acquireTicket('INVALID' as any)).rejects.toThrowError('Invalid ticket');
  });

  it('rejects returning of an invalid ticket', async () => {
    type TestType = { type: any };
    const tickets = new MemoryStore();
    const { id: ticketId } = await tickets.createWithoutId<TestType>({ type: 'INVALID' });
    const aTicketLock = new TicketLock(logger, lock, tickets);
    await expect(() => aTicketLock.returnTicket(ticketId)).rejects.toThrowError('Invalid ticket');
  });
});
