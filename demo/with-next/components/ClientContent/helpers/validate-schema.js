import * as yup from 'yup';
export const validateSchema = async (schema, payload) => {
  let errorMessage = null;
  try {
    await schema.validate(payload);
  } catch (error) {
    if (!(error instanceof yup.ValidationError)) {
      errorMessage = 'Unknown error';
      return errorMessage;
    }
    errorMessage = error.message;
  }
  return errorMessage;
};
