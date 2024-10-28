export const getUserProfile = async (address: string) => {
  const res = await fetch('https://usernames.worldcoin.org/api/v1/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      addresses: [address]
    })
  })

  const data = await res.json();
  return data.usernames[0];
};
