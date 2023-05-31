import { ethers, BigNumber } from 'ethers';
import { MetaTransaction, TransactionType, encodeSingle } from 'ethers-multisend';
import erc20ABI from '../abis/mimERC20Abi.json';
import bentoBoxAbi from '../abis/bentoAbi.json';
import repayHelperAbi from '../abis/repayHelperAbi.json';
import { DEGENBOX_ADDRESS, MIM_CONTRACT_ADDR, REPAY_HELPER_ADDR } from '../helpers/constants';
import { bn } from '@/helpers/utils';

export function getMimApproveTx(amount: BigNumber): MetaTransaction {
  let contractInterface = new ethers.utils.Interface(erc20ABI);

  return encodeSingle({
    id: '',
    type: TransactionType.callContract,
    to: MIM_CONTRACT_ADDR,
    abi: JSON.stringify(erc20ABI),
    functionSignature: contractInterface.getFunction('approve').format(),
    inputValues: {
      spender: DEGENBOX_ADDRESS,
      amount: bn(amount).toString(),
    },
    value: '0',
  });
}

export function getMimDegenboxDepositTx(from: string, amount: BigNumber): MetaTransaction {
  let contractInterface = new ethers.utils.Interface(bentoBoxAbi);

  return encodeSingle({
    id: '',
    type: TransactionType.callContract,
    to: DEGENBOX_ADDRESS,
    abi: JSON.stringify(bentoBoxAbi),
    functionSignature: contractInterface.getFunction('deposit').format(),
    inputValues: {
      token_: MIM_CONTRACT_ADDR,
      from: from,
      to: DEGENBOX_ADDRESS,
      amount: bn(amount).toString(),
      share: '0',
    },
    value: '0',
  });
}

export function getMimRepayTx(to: string, cauldron: string, amount: BigNumber): MetaTransaction {
  let contractInterface = new ethers.utils.Interface(repayHelperAbi);

  return encodeSingle({
    id: '',
    type: TransactionType.callContract,
    to: REPAY_HELPER_ADDR,
    abi: JSON.stringify(repayHelperAbi),
    functionSignature: contractInterface.getFunction('repayAmount').format(),
    inputValues: {
      to: to,
      cauldron: cauldron,
      amount: bn(amount).toString(),
    },
    value: '0',
  });
}
