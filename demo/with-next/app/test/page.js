import { SearchParams } from '@/components/ClientContent/SearchParams';
import { jsx as _jsx } from 'react/jsx-runtime';
export default function TestPage() {
  return _jsx('div', {
    className: 'bg-white text-black min-h-full p-5',
    children: _jsx(SearchParams, {}),
  });
}
