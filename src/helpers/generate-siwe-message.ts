import { GenerateSiweMessageInput } from "types/wallet-auth";
import * as yup from "yup";

const generateSiweDataSchema = (parmas: {
  integrationUrl: string;
  currentUrl: string;
}) => {
  return yup.object({
    scheme: yup.string().notRequired().oneOf(["https", "http"]), //FIXME: remove http://

    domain: yup
      .string()
      .required()
      .test({
        name: "is-domain-valid",
        message: "Invalid domain",
        test: (value) => {
          let integrationUrl: URL | undefined;

          try {
            integrationUrl = new URL(parmas.integrationUrl);
          } catch (error) {
            return false;
          }

          return integrationUrl.host === value;
        },
      }),

    address: yup.string().notRequired().default("{address}"),

    statement: yup.string().when((values: Array<string>) => {
      const [statement] = values;

      if (!statement) {
        return yup.string().notRequired();
      }

      return yup
        .string()
        .required()
        .test({
          name: "is-statement-valid",
          message: "Statement must not contain new lines",
          test: (value) => !value.includes("\n"),
        });
    }),

    uri: yup
      .string()
      .required()
      .test("is-uri-valid", "Invalid URI", (value) => {
        let uri: URL | undefined;
        let currentUrl: URL | undefined;

        try {
          uri = new URL(value);
          currentUrl = new URL(parmas.currentUrl);
        } catch (error) {
          console.error(error);
          return false;
        }

        const conditions = [
          uri.protocol === currentUrl.protocol,
          uri.host === currentUrl.host,
          uri.pathname === currentUrl.pathname,
        ];

        return conditions.every(Boolean);
      }),

    version: yup.number().required().oneOf([1]).default(1),
    chain_id: yup.number().required().oneOf([10]).default(10),
    nonce: yup.string().min(8).required(),

    issued_at: yup
      .string()
      .required()
      .test("is-issued-at-valid", "Invalid issued_at", (value) => {
        const issuedAt = new Date(value).getTime();
        const currentTime = new Date().getTime();
        const fiveMinutes = 5 * 60 * 1000;
        return Math.abs(currentTime - issuedAt) <= fiveMinutes;
      }),

    expiration_time: yup
      .string()
      .required()
      .test("is-expiration-time-valid", "Invalid expiration_time", (value) => {
        const expirationTime = new Date(value).getTime();
        const currentTime = new Date().getTime();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;

        return (
          expirationTime > currentTime &&
          expirationTime - currentTime <= sevenDays
        );
      }),

    not_before: yup
      .string()
      .required()
      .test("is-not-before-valid", "Invalid not_before", (value) => {
        const notBefore = new Date(value).getTime();
        const currentTime = new Date().getTime();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        return notBefore > currentTime && notBefore - currentTime <= sevenDays;
      }),

    request_id: yup.string().notRequired(),
  });
};

type SiweMessageData = yup.InferType<ReturnType<typeof generateSiweDataSchema>>;

const generateSiweMessageString = (siweMessageData: SiweMessageData) => {
  let siweMessage = "";

  // Include the scheme if provided
  if (siweMessageData.scheme) {
    siweMessage += `${siweMessageData.scheme}://${siweMessageData.domain} wants you to sign in with your Ethereum account:\n`;
  } else {
    siweMessage += `${siweMessageData.domain} wants you to sign in with your Ethereum account:\n`;
  }

  siweMessage += `${siweMessageData.address}\n\n`;

  if (siweMessageData.statement) {
    siweMessage += `${siweMessageData.statement}\n\n`;
  }

  siweMessage += `URI: ${siweMessageData.uri}\n`;
  siweMessage += `Version: ${siweMessageData.version}\n`;
  siweMessage += `Chain ID: ${siweMessageData.chain_id}\n`;
  siweMessage += `Nonce: ${siweMessageData.nonce}\n`;
  siweMessage += `Issued At: ${siweMessageData.issued_at}\n`;

  if (siweMessageData.expiration_time) {
    siweMessage += `Expiration Time: ${siweMessageData.expiration_time}\n`;
  }

  if (siweMessageData.not_before) {
    siweMessage += `Not Before: ${siweMessageData.not_before}\n`;
  }

  if (siweMessageData.request_id) {
    siweMessage += `Request ID: ${siweMessageData.request_id}\n`;
  }

  return siweMessage;
};

type GenerateSiweMessageOutput =
  | {
      success: false;
      error: { message: string };
    }
  | {
      success: true;
      siweMessage: string;
    };

export const generateSiweMessage = (
  params: GenerateSiweMessageInput
): GenerateSiweMessageOutput => {
  const integrationURL = new URL(params.uri);

  const schema = generateSiweDataSchema({
    integrationUrl: integrationURL.protocol + "//" + integrationURL.host,
    currentUrl: params.uri,
  });

  let siweMessageData: SiweMessageData | null = null;

  try {
    siweMessageData = schema.validateSync(params);
  } catch (error) {
    console.log(error);

    if (error instanceof yup.ValidationError) {
      return { success: false, error: { message: error.message } };
    }

    if (error instanceof Error) {
      return { success: false, error: { message: error.message } };
    }

    return { success: false, error: { message: "An unknown error occurred" } };
  }

  if (!siweMessageData) {
    return { success: false, error: { message: "An unknown error occurred" } };
  }

  const siweMessage = generateSiweMessageString(siweMessageData);
  return { success: true, siweMessage };
};
