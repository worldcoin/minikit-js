export const getUserProfile = async (address: string) => {
  const res = await fetch('https://usernames.worldcoin.org/api/v1/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      addresses: [address],
    }),
  });

  const usernames = await res.json();
  return usernames?.[0] ?? { username: null, profile_picture_url: null };
};
