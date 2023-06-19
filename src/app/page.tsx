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
import { ChangeEvent, Dispatch, MouseEvent, SetStateAction, useCallback, useEffect, useState } from 'react';
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk';
import { useFlashMessage } from '@/helpers/UseFlashMessage';
import { MetaTransaction } from 'ethers-multisend';
import {
  getMimApproveTx,
  getMimDegenboxDepositTx,
  getMimRepayTx,
  getMimTransferTx,
  getMimWithdrawTx,
} from '@/models/GnosisEncoder';
import { MIM_TREASURY_ADDR } from '@/helpers/constants';
import { handleChange, renderInputGroup } from '@/helpers/formUtils';
import _ from 'underscore';
import { StatsBar } from '@/components/StatsBar';
import { RepaymentResponse } from '@/helpers/interfaces';
import { Card } from '@/components/Card';
import { getDegenBoxMimBalance } from '@/models/DistributionCalculator';

export default function Home() {
  return (
    <div>
      <div className="container mx-auto">
        <CurveRepayer></CurveRepayer>
      </div>
    </div>
  );
}

function CurveRepayer() {
  const [refundDate, setRefundDate] = useState(findPreviousThursday().format('YYYY-MM-DD'));
  const [borrowerAddress, setBorrowerAddress] = useState('0x7a16ff8270133f063aab6c9977183d9e72835428');
  const [voterAddress, setVoterAddress] = useState('0x9B44473E223f8a3c047AD86f387B80402536B029');
  const [repaymentResponse, setRepaymentResponse] = useState<RepaymentResponse>();

  const { sdk, safe } = useSafeAppsSDK();

  // Restore form state from local storage
  useEffect(function () {
    setBorrowerAddress(
      safeJsonParse(window.localStorage.getItem('borrowerAddress')) || '0x7a16ff8270133f063aab6c9977183d9e72835428'
    );
    setVoterAddress(
      safeJsonParse(window.localStorage.getItem('voterAddress')) || '0x9B44473E223f8a3c047AD86f387B80402536B029'
    );
    setRefundDate(safeJsonParse(window.localStorage.getItem('refundDate')));
  }, []);

  const makeTxHandler = useCallback(async () => {
    let txs = Array<MetaTransaction>();

    // This should be contained in the refund response...
    try {
      if (!!repaymentResponse) {
        txs.push(getMimWithdrawTx(repaymentResponse.totalWithdraw));
        txs.push(getMimTransferTx(repaymentResponse.totalDistribution));
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
