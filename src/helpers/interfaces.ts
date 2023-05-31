import { BigNumber } from 'ethers';

export interface RepaymentResponse {
  closestBlock: BigNumber;
  borrowAddr: string;
  votingAddr: string;
  cauldrons: Array<string>;
  spellPrice: BigNumber;
  userBorrowAmounts: Array<BigNumber>;
  userVeCrvVoted: BigNumber;
  userBribesReceived: BigNumber;
  totalRefund: BigNumber;
  totalBorrowed: BigNumber;
  refunds: Array<RefundResponse>;
}

export interface RefundResponse {
  borrowAmount: BigNumber;
  cauldron: string;
  bribesReceived: BigNumber;
  maxRefund: BigNumber;
  finalRefund: BigNumber;
}
