import { auth } from '@/auth';
import { Navigation } from '@/components/Navigation';
import { Page } from '@/components/PageLayout';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
export default async function TabsLayout({ children }) {
  const session = await auth();
  // If the user is not authenticated, redirect to the login page
  if (!session) {
    console.log('Not authenticated');
    // redirect('/');
  }
  return _jsxs(Page, {
    children: [
      children,
      _jsx(Page.Footer, {
        className: 'px-0 fixed bottom-0 w-full bg-white',
        children: _jsx(Navigation, {}),
      }),
    ],
  });
}
