import { Contract, BigNumber } from 'ethers';
import { sumBns } from '@/helpers/utils';
import crvRefundLensAbi from '../abis/crvRefundLensAbi.json';
import { ALCHEMY_PROVIDER, BPS, CRV_LENS_ADDR, MAX_REFUND_RATE, WEEKS_IN_YEAR } from '@/helpers/constants';
import _ from 'underscore';

interface RefundLensInfo {
  cauldrons: Array<string>;
  spellPrice: BigNumber;
  userBorrowAmounts: Array<BigNumber>;
  userVeCrvVoted: BigNumber;
  userBribesReceived: BigNumber;
}

interface Refund {
  borrowAmount: BigNumber;
  cauldron: string;
  bribesReceived: BigNumber;
  maxRefund: BigNumber;
  finalRefund: BigNumber;
}

interface RefundInfo {
  borrowAddr: string;
  votingAddr: string;
  cauldrons: Array<string>;
  spellPrice: BigNumber;
  userVeCrvVoted: BigNumber;
  userBribesReceived: BigNumber;
  totalRefund: BigNumber;
  totalBorrow: BigNumber;
  refunds: Array<Refund>;
}

export async function getRefundInfo(
  cauldronAddrs: Array<string>,
  borrowAddr: string,
  votingAddr: string,
  blockNumber?: number
): Promise<RefundInfo> {
  let refundLensResponse = await getRefundLensResponse(cauldronAddrs, borrowAddr, votingAddr, blockNumber);
  let supplementalInfo = getSupplementalInfo(refundLensResponse);

  return {
    borrowAddr,
    votingAddr,
    ..._.omit(refundLensResponse, 'userBorrowAmounts'),
    ...supplementalInfo,
  };
}

export async function getRefundLensResponse(
  cauldronAddrs: Array<string>,
  borrowAddr: string,
  votingAddr: string,
  blockNumber?: number
) {
  const refundLensContract = new Contract(CRV_LENS_ADDR, crvRefundLensAbi, ALCHEMY_PROVIDER);

  return await refundLensContract.getRefundInfo(cauldronAddrs, borrowAddr, votingAddr, {
    blockTag: blockNumber,
  });
}

export function getSupplementalInfo(refundInfo: RefundLensInfo) {
  let { cauldrons, userBorrowAmounts } = refundInfo;
  let proRatedRefunds = Array<Refund>();

  for (let borrowAmount of userBorrowAmounts) {
    let maxRefund = getMaxRefund(borrowAmount);
    let bribesReceived = getProRatedBribes(borrowAmount, refundInfo);

    proRatedRefunds.push({
      borrowAmount,
      cauldron: cauldrons[proRatedRefunds.length],
      bribesReceived: bribesReceived,
      maxRefund: maxRefund,
      finalRefund: maxRefund.gt(bribesReceived) ? bribesReceived : maxRefund,
    });
  }

  let totalRefund = sumBns(proRatedRefunds.map((refund) => refund.finalRefund));
  let totalBorrowed = sumBns(userBorrowAmounts);
  return { totalRefund, totalBorrowed, refunds: proRatedRefunds };
}

function getMaxRefund(amount: BigNumber) {
  // NOTE: Agreement was that minimum interest rate is 11% and the
  // max interest rate is 18%. These are annualized, so must be scaled by week.

  return amount.mul(MAX_REFUND_RATE).div(BPS).div(WEEKS_IN_YEAR);
}

function getProRatedBribes(borrowAmount: BigNumber, refundInfo: RefundLensInfo) {
  let { userBorrowAmounts, userBribesReceived } = refundInfo;
  let totalBorrowed = sumBns(userBorrowAmounts);

  // NOTE: borrowAmount / totalBorrowed is the % of the bribes that
  // should be allocated to this cauldron
  return borrowAmount.mul(userBribesReceived).div(totalBorrowed);
}
