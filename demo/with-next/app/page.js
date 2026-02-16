import { ClientContent } from '@/components/ClientContent';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
const Home = async () => {
  console.log('Server Rendering Works!');
  return _jsxs('div', {
    className: 'bg-white text-black min-h-full p-5',
    children: [
      _jsx(ClientContent, {}),
      _jsx('p', { children: 'From the Server Side!' }),
    ],
  });
};
export default Home;
