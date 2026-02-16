export async function fetchTransactionHash(appConfig, transactionId) {
  try {
    const response = await fetch(
      `https://developer.worldcoin.org/api/v2/minikit/transaction/${transactionId}?app_id=${appConfig.app_id}&type=transaction`,
      {
        method: 'GET',
      },
    );
    if (!response.ok) {
      const error = await response.json();
      console.log(error);
      throw new Error(`Failed to fetch transaction status: ${error.message}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.log('Error fetching transaction status', error);
    throw new Error('Failed to fetch transaction status');
  }
}
