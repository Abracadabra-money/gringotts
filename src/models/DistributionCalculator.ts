import { Contract, BigNumber } from 'ethers';
import { ALCHEMY_PROVIDER, DEGENBOX_ADDRESS, MIM_CONTRACT_ADDR, MIM_TREASURY_ADDR } from '@/helpers/constants';
import bentoBoxAbi from '../abis/bentoAbi.json';

export async function getDegenBoxMimBalance(): Promise<BigNumber> {
  let contract = new Contract(DEGENBOX_ADDRESS, bentoBoxAbi, ALCHEMY_PROVIDER);
  return await contract.balanceOf(MIM_CONTRACT_ADDR, MIM_TREASURY_ADDR);
}

export async function getDistributionInfo(totalRefund: BigNumber) {
  let mimBalance = await getDegenBoxMimBalance();

  return {
    totalWithdraw: mimBalance,
    totalDistribution: mimBalance.sub(totalRefund),
  };
}
