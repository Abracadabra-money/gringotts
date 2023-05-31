import { bnToFloat, formatNumber } from '@/helpers/utils';
import { BigNumber } from 'ethers';

export function StatsBar(props: { stats: any }) {
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
