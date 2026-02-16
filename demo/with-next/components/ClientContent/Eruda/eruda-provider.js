'use client';
import eruda from 'eruda';
import { useEffect } from 'react';
import { Fragment as _Fragment, jsx as _jsx } from 'react/jsx-runtime';
export const Eruda = (props) => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        eruda.init();
      } catch (error) {
        console.log('Eruda failed to initialize', error);
      }
    }
  }, []);
  return _jsx(_Fragment, { children: props.children });
};
