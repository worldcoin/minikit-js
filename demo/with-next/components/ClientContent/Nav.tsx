import { signIn, signOut, useSession } from 'next-auth/react';
import { useMemo } from 'react';

export const Nav = () => {
  const { data: session } = useSession();
  const user = useMemo(() => session?.user, [session]);

  return (
    <header className="flex justify-between gap-x-2">
      <h1 className="text-2xl font-bold">MiniKit V1</h1>

      <button
        onClick={user?.name ? () => signOut() : () => signIn('worldcoin')}
        className="text-white bg-black hover:bg-gray-500 transition p-4 leading-[1] rounded-md"
      >
        {user?.name ? 'Sign Out' : 'Sign In'}
      </button>
      {/* <button
        onClick={user?.name ? () => signOut() : () => signIn('google')}
        className="text-white bg-blue-500 hover:bg-blue-300 transition p-4 leading-[1] rounded-md"
      >
        {user?.name ? 'Google Sign Out' : 'Google Sign In'}
      </button> */}
    </header>
  );
};
