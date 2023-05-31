import { providers, Contract } from 'ethers';
import { NextRequest, NextResponse } from 'next/server';
import crvRefundLensAbi from '../../../abis/crvRefundLensAbi.json';
import { CRV_CAULDRONS, CRV_LENS_ADDR } from '@/helpers/constants';
import { getRefundInfo } from '@/models/RefundCalculator';

export async function POST(request: NextRequest) {
  const { time, borrowerAddress, voterAddress } = await request.json();
  let closestBlock = await findClosestBlock(time);
  let refundInfo = await getRefundInfo(CRV_CAULDRONS, borrowerAddress, voterAddress, closestBlock);

  return NextResponse.json({
    closestBlock: closestBlock,
    ...refundInfo,
  });
}

async function findClosestBlock(time: number) {
  // Your remaining logic here
  // Set up provider to connect to an Ethereum node
  const provider = new providers.AlchemyProvider('mainnet', process.env.ALCHEMY_KEY);

  // Get the current block number
  const currentBlockNumber = await provider.getBlockNumber();

  // Set the initial lower bound and upper bound for the binary search
  let lowerBound = 0;
  let upperBound = currentBlockNumber;

  // Set a flag to indicate if the target block has been found
  let found = false;

  // Loop until the target block is found
  while (!found) {
    // Calculate the middle block number
    const middleBlockNumber = Math.floor((lowerBound + upperBound) / 2);

    // Get the block at the middle block number
    const block = await provider.getBlock(middleBlockNumber);

    // Check if the block time is after the target time
    if (block.timestamp > time) {
      // If the block time is after the target time, set the upper bound to the middle block number
      upperBound = middleBlockNumber;
    } else {
      // If the block time is not after the target time, set the lower bound to the middle block number
      lowerBound = middleBlockNumber;
    }

    // Check if the lower bound and upper bound have converged
    if (lowerBound + 1 >= upperBound) {
      // If the lower bound and upper bound have converged, set the flag to true to stop the loop
      found = true;
    }
  }

  // Return the block number of the closest block after the target time
  return upperBound;
}
