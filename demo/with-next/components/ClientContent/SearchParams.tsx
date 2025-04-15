'use client';

import { useSearchParams } from 'next/navigation';

export const SearchParams = () => {
  const searchParams = useSearchParams();
  const params = Object.fromEntries(searchParams.entries());

  return (
    <div className="grid gap-y-2">
      <h2 className="text-2xl font-bold">Search Parameters</h2>
      <div className="bg-gray-50 border-l-4 border-gray-400 p-4">
        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
          {JSON.stringify(params, null, 2)}
        </pre>
      </div>
    </div>
  );
};
