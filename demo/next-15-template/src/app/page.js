import { Page } from '@/components/PageLayout';
import { jsx as _jsx } from 'react/jsx-runtime';
import { AuthButton } from '../components/AuthButton';
export default function Home() {
  return _jsx(Page, {
    children: _jsx(Page.Main, {
      className: 'flex flex-col items-center justify-center',
      children: _jsx(AuthButton, {}),
    }),
  });
}
