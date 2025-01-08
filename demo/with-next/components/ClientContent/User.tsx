import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

export const User = () => {
  const { data: session } = useSession();
  const user = useMemo(() => session?.user, [session]);

  return (
    <div>
      <h2>Session User:</h2>
      {user?.name ? (
        <p className="truncate">
          User name:{' '}
          <span className="font-bold max-w-full truncate break-all whitespace-break-spaces">
            {user?.name}
          </span>
        </p>
      ) : (
        <span className="font-bold">No user</span>
      )}
    </div>
  );
};
