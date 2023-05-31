import { findKey } from 'underscore';
import { BigNumber, ethers, providers } from 'ethers';
import moment from 'moment';

export function safeJsonParse(value: string | null): string {
  try {
    if (value == null) return '';
    else return JSON.parse(value) || '';
  } catch (e) {
    console.log(`Error parsing JSON: ${value}`);
    return '';
  }
}

export function formatAddress(address: string) {
  return address.substring(0, 5) + '...' + address.substring(address.length - 5, address.length);
}

export function formatNumber(number: number, decimalPlaces = 2): string {
  const decimalSeparator = '.';
  const thousandsSeparator = ',';

  // Convert the BigNumber to a string with the desired decimal places

  // Split the formatted number into integer and decimal parts
  const [integerPart, decimalPart] = number.toFixed(decimalPlaces).split('.');

  // Add thousands separators to the integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);

  // Combine the formatted integer part and decimal part (if exists)
  let result = decimalPart ? `${formattedInteger}${decimalSeparator}${decimalPart}` : formattedInteger;

  return result;
}

export function bnToFloat(num: BigNumber, decimal: number) {
  return parseFloat(ethers.utils.formatUnits(num, decimal));
}

export function expandDecimals(decimal: number) {
  return BigNumber.from(10).pow(decimal);
}

export function bn(num: string | number | BigNumber) {
  return BigNumber.from(num);
}

export function getProvider(forkUrl: string): ethers.providers.JsonRpcProvider {
  return new ethers.providers.JsonRpcProvider(forkUrl);
}

export function getContract(
  address: string,
  abi: ethers.ContractInterface,
  provider: ethers.providers.JsonRpcProvider
) {
  return new ethers.Contract(address, abi, provider);
}

export function findThursdayAfter(inputDate: string) {
  let date = moment.utc(inputDate);

  if (date.day() < 4) {
    return date.day(4).toDate();
  } else {
    return date.day(11).toDate();
  }
}

export function findPreviousThursday() {
  let date = moment.utc();

  while (date.day() != 4) {
    date = date.subtract(1, 'day');
  }

  return date;
}

export async function findClosestBlock(time: number) {
  // Set up provider to connect to an Ethereum node
  console.log('KEY', process.env.ALCHEMY_KEY);
  const provider = new providers.AlchemyProvider('mainnet', process.env.ALCHEMY_KEY);
  // const provider = new providers.JsonRpcProvider('https://eth.llamarpc.com');

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
    // console.log('Block number:', block.number, 'Block timestamp:', block.timestamp);

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

  // console.log(time, upperBound);
  // Return the block number of the closest block after the target time
  return upperBound;
}

export function classNames(...classes: any) {
  return classes.filter(Boolean).join(' ');
}

export async function postData(path: string, params: { [any: string]: any }) {
  try {
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    };

    let response = await fetch(path, requestOptions);

    if (!response.ok) {
      throw new Error('Request failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

export function sumBns(bns: Array<BigNumber>) {
  return bns.reduce((total, bn) => total.add(bn), bn(0));
}

export function getTimestampFromDate(date: string) {
  return Math.floor(new Date(date).getTime() / 1000);
}
