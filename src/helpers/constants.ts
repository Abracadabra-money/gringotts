import { providers } from 'ethers';
import { bn } from './utils';

export const DEGENBOX_ADDRESS = '0xd96f48665a1410C0cd669A88898ecA36B9Fc2cce';
export const MIM_CONTRACT_ADDR = '0x99D8a9C45b2ecA8864373A26D1459e3Dff1e17F3';
export const REPAY_HELPER_ADDR = '0x8f7405d5738468863A516B3Cb6C8984845983D9e';
export const MIM_TREASURY_ADDR = '0xDF2C270f610Dc35d8fFDA5B453E74db5471E126B';
export const SPELL_REWARD_DISTRIBUTOR_ADDR = '0x953dab0e64828972853e7faa45634620a40fa479';

export const CRV_CAULDRONS = [
  '0x207763511da879a900973A5E092382117C3c1588',
  '0x7d8dF3E4D06B0e19960c19Ee673c0823BEB90815',
];

export const CRV_LENS_ADDR = '0xC93E1daFf233Df6cc7F811C9dca7721709804016';
export const MAX_REFUND_RATE = bn(700); // 18% - 11%
export const BPS = bn(10000);
export const WEEKS_IN_YEAR = 52;

export const ALCHEMY_PROVIDER = new providers.AlchemyProvider('mainnet', process.env.ALCHEMY_KEY);
