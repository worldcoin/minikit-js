import Link from 'next/link';
import {
  Fragment as _Fragment,
  jsx as _jsx,
  jsxs as _jsxs,
} from 'react/jsx-runtime';
export const ExternalLinks = () => {
  return _jsxs(_Fragment, {
    children: [
      _jsx('p', {
        className: 'text-xl font-bold',
        children: 'Test External Links',
      }),
      _jsxs('div', {
        className: 'grid md:grid-cols-2 gap-4',
        children: [
          _jsx(Link, {
            href: 'https://worldcoin.org/world-chain',
            className: 'bg-green-500 text-white text-center rounded-lg p-3',
            children: 'Valid Associated Domain (Link)',
          }),
          _jsx(Link, {
            href: 'worldapp://mini-app?app_id=app_staging_e387587d26a286fb5bea1d436ba0b2a3&path=features',
            className: 'bg-green-500 text-white text-center rounded-lg p-3',
            children: 'worldapp:// deep link',
          }),
          _jsx(Link, {
            href: 'worldapp://mini-app?app_id=app-store&path=explore?collection_id=top_games',
            className: 'bg-green-500 text-white text-center rounded-lg p-3',
            children: 'worldapp:// games tab collection deep link',
          }),
          _jsx(Link, {
            href: 'worldapp://mini-app?app_id=app-store&path=explore?collection_id=must_have_apps',
            className: 'bg-green-500 text-white text-center rounded-lg p-3',
            children: 'worldapp:// apps tab collection deep link',
          }),
          _jsx('button', {
            onClick: () => {
              window.open(
                'https://worldcoin.org/app-store/explore-tab?collection_id=top_games',
                '_blank',
              );
            },
            className:
              'text-white bg-green-500 hover:bg-blue-300 transition p-4 leading-[1] rounded-lg',
            children: 'world.org Games Collection Deep Link',
          }),
          _jsx('button', {
            onClick: () => {
              window.open(
                'https://worldcoin.org/app-store/explore-tab?collection_id=new_and_noteworthy',
                '_blank',
              );
            },
            className:
              'text-white bg-green-500 hover:bg-blue-300 transition p-4 leading-[1] rounded-lg',
            children: 'world.org Apps Collection Deep Link',
          }),
          _jsx('button', {
            onClick: () => {
              window.open(
                'https://world.org/mini-app?app_id=app_staging_e387587d26a286fb5bea1d436ba0b2a3&path=features',
                '_blank',
              );
            },
            className:
              'text-white bg-green-500 hover:bg-blue-300 transition p-4 leading-[1] rounded-lg',
            children: 'Internal Deep Link Test',
          }),
          _jsx(Link, {
            href: 'https://docs.worldcoin.org',
            className: 'bg-green-500 text-white text-center rounded-lg p-3',
            children: 'Valid Subdomain (Link)',
          }),
          _jsx('button', {
            onClick: () => window.open('https://docs.worldcoin.org'),
            className:
              'text-white bg-green-500 transition p-4 leading-[1] rounded-lg',
            children: 'Valid Subdomain (Button)',
          }),
          _jsx(Link, {
            href: 'https://worldcoin-developer-portal.eu.auth0.com/u/login/identifier',
            className: 'bg-green-500 text-white text-center rounded-lg p-3',
            children: 'Valid double Subdomain (Link)',
          }),
          _jsx('button', {
            onClick: () =>
              window.open(
                'https://worldcoin-developer-portal.eu.auth0.com/u/login/identifier',
              ),
            className:
              'text-white bg-green-500 transition p-4 leading-[1] rounded-lg',
            children: 'Valid double subdomain (Button)',
          }),
          _jsx('button', {
            onClick: () => navigator.share({ url: 'https://google.com' }),
            className:
              'text-white bg-green-500 transition p-4 leading-[1] rounded-lg',
            children: 'Open Share Page',
          }),
          _jsx('button', {
            onClick: () =>
              window.open(
                'https://docs.worldcoin.org?open_out_of_window=true',
                '_blank',
              ),
            className:
              'text-white bg-green-500 transition p-4 leading-[1] rounded-lg',
            children: 'Open Outside App',
          }),
          _jsx('button', {
            onClick: async () => {
              try {
                const response = await fetch('/800.jpeg');
                const blob = await response.blob();
                const file = new File([blob], '800.jpeg', {
                  type: 'image/jpeg',
                });
                await navigator.share({
                  url: 'https://google.com',
                  files: [file],
                });
              } catch (error) {
                console.error('Error sharing:', error);
              }
            },
            className:
              'text-white bg-green-500 transition p-4 leading-[1] rounded-lg',
            children: 'Share Image',
          }),
          _jsx('button', {
            onClick: () => window.open('https://google.com', '_blank'),
            className:
              'text-white bg-red-500 transition p-4 leading-[1] rounded-lg',
            children: 'Invalid External Link (Button)',
          }),
          _jsx(Link, {
            href: 'https://google.com',
            className: 'bg-red-500 text-white text-center rounded-lg p-3',
            children: 'Invalid External Link (Link)',
          }),
        ],
      }),
    ],
  });
};
