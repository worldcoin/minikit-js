import { ClientContent } from '@/components/ClientContent';

const Home = async () => {
  console.log('Server Rendering Works!');
  return (
    <div className="bg-white text-black min-h-full p-5">
      <ClientContent />
      <p>From the Server Side!</p>
    </div>
  );
};

export default Home;
