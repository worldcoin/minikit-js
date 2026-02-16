'use client';
import { useSearchParams } from 'next/navigation';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
export const SearchParams = () => {
  const searchParams = useSearchParams();
  const params = Object.fromEntries(searchParams.entries());
  return _jsxs('div', {
    className: 'grid gap-y-2',
    children: [
      _jsx('h2', {
        className: 'text-2xl font-bold',
        children: 'Search Parameters',
      }),
      _jsx('div', {
        className: 'bg-gray-50 border-l-4 border-gray-400 p-4',
        children: _jsx('pre', {
          className: 'text-sm text-gray-700 whitespace-pre-wrap',
          children: JSON.stringify(params, null, 2),
        }),
      }),
    ],
  });
};
