const createDebounce = () => {
  let timeoutId: NodeJS.Timeout;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <T extends (...args: any) => any>(fn: T, delay: number) => {
    return (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        fn(...args);
      }, delay);
    };
  };
};

const DEBOUNCE_DELAY_MS = 300;
const debounce = createDebounce();

type SearchUsernameResponseBodySuccess = Array<{
  address: string;
  profile_picture_url: string | null;
  username: string;
}>;

export type GetSearchedUsernameResult = Awaited<
  ReturnType<typeof getSearchedUsername>
>;

const getSearchedUsername = async (username: string) => {
  const response = await fetch(
    `https://usernames.worldcoin.org/api/v1/search/${username}`,
  );

  if (response.status === 200) {
    const json = (await response.json()) as SearchUsernameResponseBodySuccess;
    return { status: response.status, data: json };
  }

  return { status: response.status, error: 'Error fetching data' };
};

type Props = {
  value: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setSearchedUsernames: (searchedUsernames: GetSearchedUsernameResult) => void;
  className?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
};

/**
 * Simple component that allows users to search for usernames.
 *
 * It is encouraged to build your own components, using this as a base/reference
 *
 * You can add more <input /> props/override existing ones by passing inputProps.
 * Debounce delay is 300ms.
 */
export const UsernameSearch = ({
  value,
  handleChange,
  setSearchedUsernames,
  className,
  inputProps,
}: Props) => {
  const debouncedSearch = debounce(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const username = e.target.value;
      const data = await getSearchedUsername(username);

      setSearchedUsernames(data);
    },
    DEBOUNCE_DELAY_MS,
  );

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e);
    handleChange(e);
  };

  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      className={className || 'rounded-md border-black border-2'}
      {...inputProps}
    />
  );
};
