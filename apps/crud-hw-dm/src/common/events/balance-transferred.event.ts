import { randomUUID } from 'crypto';

export class BalanceTransferredEvent {
  eventId!: string;
  transferId!: string;
  fromUserId!: string;
  toUserId!: string;
  toUserLogin!: string;
  amount!: string;
  occuredAt!: string;

  constructor(
    senderId: string,
    recipientId: string,
    recipientLogin: string,
    amount: string
  ) {
    this.eventId = randomUUID();
    this.transferId = randomUUID();
    this.fromUserId = senderId;
    this.toUserId = recipientId;
    this.toUserLogin = recipientLogin;
    this.amount = amount;
    this.occuredAt = new Date().toISOString();
  }
}
