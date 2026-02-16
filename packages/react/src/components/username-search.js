import { jsx as _jsx } from 'react/jsx-runtime';
const createDebounce = () => {
  let timeoutId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (fn, delay) => {
    return (...args) => {
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
const getSearchedUsername = async (username) => {
  const response = await fetch(
    `https://usernames.worldcoin.org/api/v1/search/${username}`,
  );
  if (response.status === 200) {
    const json = await response.json();
    return { status: response.status, data: json };
  }
  return { status: response.status, error: 'Error fetching data' };
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
}) => {
  const debouncedSearch = debounce(async (e) => {
    const username = e.target.value;
    const data = await getSearchedUsername(username);
    setSearchedUsernames(data);
  }, DEBOUNCE_DELAY_MS);
  const onChange = (e) => {
    debouncedSearch(e);
    handleChange(e);
  };
  return _jsx('input', {
    type: 'text',
    value: value,
    onChange: onChange,
    className: className || 'rounded-md border-black border-2',
    ...inputProps,
  });
};
