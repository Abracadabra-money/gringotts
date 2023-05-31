import _ from 'underscore';

import { RefundResponse } from '@/helpers/interfaces';
import { bnToFloat, formatNumber } from '@/helpers/utils';

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
