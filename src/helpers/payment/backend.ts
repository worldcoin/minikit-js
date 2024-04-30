// Payment references should be generated and stored in the backend as the client is unsafe

export const generateReferenceId = () => {
  return crypto.randomUUID();
};
