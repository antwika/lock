import { ILogger } from '@antwika/common';
import { IStore } from '@antwika/store';
import { Lock } from './Lock';

export type TicketId = string;

export type TicketType = 'READ' | 'WRITE';

export type Ticket = {
  type: TicketType,
};

/**
 * This kind of lock provides the caller the possibility to obtain a lock and a reusable ticket
 * to hold onto for subsequent actions as long as required.
 *
 * When a ticket is returned, it invalidates the ticket and the locking is released.
 */
export class TicketLock {
  protected readonly logger: ILogger;

  protected readonly lock: Lock;

  private readonly tickets: IStore;

  /**
   * A wrapper that enforces locking of a store. It returns a ticket once a lock has been
   * successfully acquired. The ticket can then be used for accessing the methods of the store.
   * Finally the ticket can be returned in order to release the lock.
   *
   * @param logger A logger for output.
   * @param lock A lock that informs the issuance synchronization of tickets issuance.
   * @param tickets A storage that keeps/persists the issued tickets.
   */
  constructor(logger: ILogger, lock: Lock, tickets: IStore) {
    this.logger = logger;
    this.lock = lock;
    this.tickets = tickets;
  }

  /**
   * Acquire a lock for the partition store.
   *
   * @returns A ticket to be used for accessing the partition store.
   * @throws An error if the provided ticket is invalid.
   */
  async acquireTicket(ticketType: TicketType) {
    switch (ticketType) {
      case 'READ': await this.lock.beginRead(); break;
      case 'WRITE': await this.lock.beginWrite(); break;
      default: throw new Error('Invalid ticket type provided.');
    }

    const { id } = await this.tickets.createWithoutId<Ticket>({ type: ticketType });
    this.logger.debug(`Acquired lock[ticketId: ${id}]!`);

    return id;
  }

  /**
   * Releases the partition store lock.
   *
   * @param ticketId A ticket id to be returned. This will make it unusable afterwards.
   * @throws An error if the provided ticket is invalid.
   */
  async returnTicket(ticketId: TicketId): Promise<void> {
    const ticket = await this.checkTicket(['READ', 'WRITE'], ticketId);
    this.logger.debug(`Awaiting release of lock[ticketId: ${ticket.id}]...`);

    if (ticket.type === 'READ') await this.lock.endRead();
    if (ticket.type === 'WRITE') await this.lock.endWrite();

    await this.tickets.delete(ticket.id);
    this.logger.debug(`Released lock[ticketId: ${ticket.id}]!`);
  }

  /**
   * Verifies the validity of a provided ticket id.
   *
   * @param ticketTypes The list of acceptable ticket types.
   * @param ticketId The ticket id to verify.
   * @returns Returns a valid ticket.
   * @throws An error if the provided ticket is invalid.
   */
  private async checkTicket(ticketTypes: TicketType[], ticketId: TicketId) {
    try {
      const ticket = await this.tickets.read<Ticket>(ticketId);
      if (!ticketTypes.includes(ticket.type)) throw new Error('Invalid ticket type');
      return ticket;
    } catch (err) {
      this.logger.warning('Attempted to use an invalid ticket with store!');
      throw new Error('Invalid ticket');
    }
  }
}
