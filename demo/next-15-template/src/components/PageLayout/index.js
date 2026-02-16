import clsx from 'clsx';
import { jsx as _jsx } from 'react/jsx-runtime';
import { twMerge } from 'tailwind-merge';
/**
 * This component is a simple page layout component to help with design consistency
 * Feel free to modify this component to fit your needs
 */
export const Page = (props) => {
  return _jsx('div', {
    className: twMerge(clsx('flex h-dvh flex-col', props.className)),
    children: props.children,
  });
};
const Header = (props) => {
  return _jsx('header', {
    className: twMerge(
      'bg-white flex flex-col justify-center px-6 pt-6 pb-3 z-10',
      clsx(props.className),
    ),
    children: props.children,
  });
};
const Main = (props) => {
  return _jsx('main', {
    className: twMerge(clsx('grow overflow-y-auto p-6 pt-3', props.className)),
    children: props.children,
  });
};
const Footer = (props) => {
  return _jsx('footer', {
    className: twMerge('px-6 pb-[35px]', clsx(props.className)),
    children: props.children,
  });
};
Page.Header = Header;
Page.Main = Main;
Page.Footer = Footer;
