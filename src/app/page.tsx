'use client';

import SubmitButton from '@/components/SubmitButton';
import {
  bn,
  bnToFloat,
  formatNumber,
  findPreviousThursday,
  getTimestampFromDate,
  postData,
  safeJsonParse,
} from '@/helpers/utils';
import { getRefundInfo, getSupplementalInfo } from '../models/RefundCalculator';
import { ChangeEvent, Dispatch, MouseEvent, SetStateAction, useCallback, useEffect, useState } from 'react';
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk';
import { useFlashMessage } from '@/helpers/UseFlashMessage';
import { MetaTransaction } from 'ethers-multisend';
import { getMimApproveTx, getMimDegenboxDepositTx, getMimRepayTx } from '@/models/GnosisEncoder';
import { MIM_TREASURY_ADDR } from '@/helpers/constants';
import { handleChange, renderInputGroup } from '@/helpers/formUtils';
import _ from 'underscore';
import { BigNumber } from 'ethers';

interface RepaymentResponse {
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

interface RefundResponse {
  borrowAmount: BigNumber;
  cauldron: string;
  bribesReceived: BigNumber;
  maxRefund: BigNumber;
  finalRefund: BigNumber;
}

export default function Home() {
  return (
    <div>
      <div className="container mx-auto">
        <CurveRepayer></CurveRepayer>
      </div>
    </div>
  );
}

export function CurveRepayer() {
  const [refundDate, setRefundDate] = useState(findPreviousThursday().format('YYYY-MM-DD'));
  const [borrowerAddress, setBorrowerAddress] = useState('');
  const [voterAddress, setVoterAddress] = useState('');
  const [repaymentResponse, setRepaymentResponse] = useState<RepaymentResponse>();

  const { sdk, safe } = useSafeAppsSDK();

  // Restore form state from local storage
  useEffect(function () {
    setBorrowerAddress(safeJsonParse(window.localStorage.getItem('borrowerAddress')));
    setVoterAddress(safeJsonParse(window.localStorage.getItem('voterAddress')));
    setRefundDate(safeJsonParse(window.localStorage.getItem('refundDate')));
  }, []);

  const makeTxHandler = useCallback(async () => {
    let txs = Array<MetaTransaction>();

    // This should be contained in the refund response...
    try {
      if (!!repaymentResponse) {
        txs.push(getMimApproveTx(repaymentResponse.totalRefund));
        txs.push(getMimDegenboxDepositTx(MIM_TREASURY_ADDR, repaymentResponse.totalRefund));
        repaymentResponse.refunds.forEach((refund) => {
          txs.push(getMimRepayTx(repaymentResponse.borrowAddr, refund.cauldron, refund.finalRefund));
        });
      }

      const { safeTxHash } = await sdk.txs.send({ txs });
      const safeTx = await sdk.txs.getBySafeTxHash(safeTxHash);
    } catch (e) {
      console.error(e);
    }
  }, [safe, sdk, repaymentResponse]);

  return (
    <div className="pb-6 mt-5">
      <RefundInputs
        setRepaymentResponse={setRepaymentResponse}
        setRefundDate={setRefundDate}
        setBorrowerAddress={setBorrowerAddress}
        setVoterAddress={setVoterAddress}
        refundDate={refundDate}
        borrowerAddress={borrowerAddress}
        voterAddress={voterAddress}
      ></RefundInputs>

      <div className="col-span-10 col-start-2 lg:col-span-6 lg:mt-10">
        <StatsBar
          stats={
            repaymentResponse &&
            _.pick(
              repaymentResponse,
              'closestBlock',
              'spellPrice',
              'userVeCrvVoted',
              'userBribesReceived',
              'totalRefund',
              'totalBorrowed'
            )
          }
        ></StatsBar>
        <Card refunds={repaymentResponse?.refunds}></Card>
        <button
          className="w-full lg:w-fit justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-800 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-5"
          onClick={makeTxHandler}
          hidden={!repaymentResponse?.refunds}
        >
          Submit Repayment
        </button>
      </div>
    </div>
  );
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

function RefundInputs(props: {
  setRepaymentResponse: Dispatch<SetStateAction<RepaymentResponse | undefined>>;
  setRefundDate: Dispatch<SetStateAction<string>>;
  setBorrowerAddress: Dispatch<SetStateAction<string>>;
  setVoterAddress: Dispatch<SetStateAction<string>>;
  refundDate: string;
  borrowerAddress: string;
  voterAddress: string;
}) {
  const { showFlashMessage } = useFlashMessage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function fetchCurveRepayment(time: number, borrowerAddress: string, voterAddress: string) {
    let response = await postData('/api/curveRepayment', { time, borrowerAddress, voterAddress });
    return response;
  }

  async function getInfoHandler(event: MouseEvent<HTMLButtonElement>) {
    try {
      setIsSubmitting(true);
      event.preventDefault();
      let response = await fetchCurveRepayment(
        getTimestampFromDate(props.refundDate),
        props.borrowerAddress,
        props.voterAddress
      );
      props.setRepaymentResponse(response);
    } catch (error) {
      showFlashMessage({
        type: 'error',
        heading: 'Porcodillo!',
        message: `Error: ${error}`,
      });
    }

    setIsSubmitting(false);
  }

  return (
    <div>
      <h2 className="text-base font-semibold leading-7 text-gray-900">Refund Inputs</h2>

      <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-12">
        <div className="md:col-span-4 lg:col-span-2">
          {renderInputGroup(
            'date',
            'Date',
            'YYYY-MM-DD',
            props.refundDate,
            (event: ChangeEvent) =>
              handleChange('refundDate', (event.target as HTMLInputElement).value, props.setRefundDate),
            { type: 'date' }
          )}
        </div>

        <div className="md:col-span-4">
          {renderInputGroup(
            'borrowerAddress',
            'Borrower Address',
            '0x123...',
            props.borrowerAddress,
            (event: ChangeEvent) =>
              handleChange('borrowerAddress', (event.target as HTMLInputElement).value, props.setBorrowerAddress)
          )}
        </div>

        <div className="md:col-span-4">
          {renderInputGroup('voterAddress', 'Voter Address', '0x123...', props.voterAddress, (event: ChangeEvent) =>
            handleChange('voterAddress', (event.target as HTMLInputElement).value, props.setVoterAddress)
          )}
        </div>

        <div className="md:col-span-12 lg:col-span-2 mt-1">
          <label>&nbsp;</label>
          <SubmitButton handleSubmit={getInfoHandler} isSubmitting={isSubmitting} />
        </div>
      </div>
    </div>
  );
}

function StatsBar(props: { stats: any }) {
  function format(key: string, value: BigNumber) {
    switch (key) {
      case 'closestBlock':
        return value.toString();
      case 'spellPrice':
        return `$${bnToFloat(value, 18)}`;
      case 'userVeCrvVoted':
        return `${formatNumber(bnToFloat(value, 18), 0)}`;
      case 'userBribesReceived':
        return `$${formatNumber(bnToFloat(value, 18), 0)}`;
      case 'totalRefund':
        return `$${formatNumber(bnToFloat(value, 18), 0)}`;
      case 'totalBorrowed':
        return `$${formatNumber(bnToFloat(value, 18), 0)}`;
    }
  }

  return (
    <div>
      <dl className="mt-5 grid grid-cols-1 rounded-lg bg-gray-100 md:grid-cols-6 my-5 divide-x divide-gray-200 md:divide-x md:divide-y-0">
        {props?.stats &&
          Object.entries(props.stats).map(([key, value]) => (
            <div key={key} className="sm:p-6">
              <dt className="text-base font-normal text-gray-900">{key}</dt>
              <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
                <div className="flex items-baseline text-2xl font-semibold text-indigo-600">
                  {format(key, value as BigNumber)}
                </div>
              </dd>
            </div>
          ))}
      </dl>
    </div>
  );
}

export function Card(props: { refunds: any }) {
  const cauldrons = [
    {
      address: '0x207763511da879a900973A5E092382117C3c1588',
      name: 'CRV Large',
      imageUrl: '/crvLogo.png',
    },
    {
      address: '0x7d8dF3E4D06B0e19960c19Ee673c0823BEB90815',
      name: 'CRV Small',
      imageUrl: '/crvLogo.png',
    },
  ];

  function findMetadata(address: string) {
    return _.find(cauldrons, (cauldron) => cauldron.address.toLowerCase() === address.toLowerCase());
  }

  return (
    <ul role="list" className="grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-3 xl:gap-x-8">
      {Array.isArray(props.refunds) &&
        props.refunds.map((refund: RefundResponse) => (
          <li key={refund.cauldron} className="overflow-hidden rounded-xl border border-gray-200">
            <div className="flex items-center gap-x-4 border-b border-gray-900/5 bg-gray-50 p-6">
              <img
                src={findMetadata(refund.cauldron)?.imageUrl}
                alt={findMetadata(refund.cauldron)?.name}
                className="h-12 w-12 flex-none rounded-lg object-cover ring-1 ring-gray-900/10"
              />
              <div className="text-md font-medium leading-6 text-gray-900">{findMetadata(refund.cauldron)?.name}</div>
            </div>
            <dl className="-my-3 divide-y divide-gray-100 px-6 py-4 text-sm leading-6">
              <div className="flex justify-between gap-x-4 py-3">
                <dt className="text-gray-500">Borrow Amount</dt>
                <dd className="text-gray-700">{`$${formatNumber(bnToFloat(refund.borrowAmount, 18), 0)}`}</dd>
              </div>
              <div className="flex justify-between gap-x-4 py-3">
                <dt className="text-gray-500">Pro-rated Bribes</dt>
                <dd className="text-gray-700">{`$${formatNumber(bnToFloat(refund.bribesReceived, 18), 0)}`}</dd>
              </div>
              <div className="flex justify-between gap-x-4 py-3">
                <dt className="text-gray-500">Max Refund</dt>
                <dd className="flex items-start gap-x-2">
                  <div className="text-gray-700">{`$${formatNumber(bnToFloat(refund.maxRefund, 18), 0)}`}</div>
                </dd>
              </div>
              <div className="flex justify-between gap-x-4 py-3">
                <dt className="text-gray-500">Final Refund</dt>
                <dd className="flex items-start gap-x-2">
                  <div className="font-medium text-indigo-600">{`$${formatNumber(
                    bnToFloat(refund.finalRefund, 18),
                    0
                  )}`}</div>
                </dd>
              </div>
            </dl>
          </li>
        ))}
    </ul>
  );
}
