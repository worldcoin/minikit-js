import {
  MiniAppSendTransactionPayload,
  MiniKit,
  ResponseEvent,
  SendTransactionErrorCodes,
} from "@worldcoin/minikit-react";
import { useWaitForTransactionReceipt } from "@worldcoin/minikit-react";
import { useEffect, useState } from "react";
import * as yup from "yup";
import { validateSchema } from "./helpers/validate-schema";
import DEXABI from "../../abi/DEX.json";
import ANDYABI from "../../abi/Andy.json";
import { createPublicClient, http } from "viem";
import { worldchain } from "viem/chains";

const sendTransactionSuccessPayloadSchema = yup.object({
  status: yup.string<"success">().oneOf(["success"]),
  transaction_status: yup.string<"submitted">().oneOf(["submitted"]),
  transaction_id: yup.string().required(),
  from: yup.string().optional(),
  chain: yup.string().required(),
  timestamp: yup.string().required(),
});

const sendTransactionErrorPayloadSchema = yup.object({
  error_code: yup
    .string<SendTransactionErrorCodes>()
    .oneOf(Object.values(SendTransactionErrorCodes))
    .required(),
  status: yup.string<"error">().equals(["error"]).required(),
});

const testTokens = {
  optimism: {
    USDC: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
    USDCE: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
  },
  worldchain: {
    USDCE: "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1",
  },
};

export const SendTransaction = () => {
  const [transactionData, setTransactionData] = useState<Record<
    string,
    any
  > | null>(null);
  const [receivedSendTransactionPayload, setReceivedSendTransactionPayload] =
    useState<Record<string, any> | null>(null);
  const [tempInstallFix, setTempInstallFix] = useState(0);
  const [
    sendTransactionPayloadValidationMessage,
    setSendTransactionPayloadValidationMessage,
  ] = useState<string | null>();

  const [transactionId, setTransactionId] = useState<string>("");

  const client = createPublicClient({
    chain: worldchain,
    transport: http("https://worldchain-mainnet.g.alchemy.com/public"),
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      client: client,
      appConfig: {
        app_id: "app_7b8d0ff88e9ece4d97febf5097e58d8f",
      },
      transactionId: transactionId,
    });

  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }

    MiniKit.subscribe(
      ResponseEvent.MiniAppSendTransaction,
      async (payload: MiniAppSendTransactionPayload) => {
        console.log("MiniAppSendTransaction, SUBSCRIBE PAYLOAD", payload);

        if (payload.status === "error") {
          const errorMessage = await validateSchema(
            sendTransactionErrorPayloadSchema,
            payload
          );

          if (!errorMessage) {
            setSendTransactionPayloadValidationMessage("Payload is valid");
          } else {
            setSendTransactionPayloadValidationMessage(errorMessage);
          }
        } else {
          const errorMessage = await validateSchema(
            sendTransactionSuccessPayloadSchema,
            payload
          );

          if (!errorMessage) {
            setSendTransactionPayloadValidationMessage("Payload is valid");
          } else {
            setSendTransactionPayloadValidationMessage(errorMessage);
          }

          // const responseJson = await response.json();

          // setSendTransactionVerificationMessage(
          //   responseJson.isValid
          //     ? "Valid! Successful Transaction"
          //     : `Failed: ${responseJson.message}`
          // );
          setTransactionId(payload.transaction_id);
        }

        setReceivedSendTransactionPayload(payload);
      }
    );

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppSendTransaction);
    };
  }, [tempInstallFix]);

  const onSendTransactionClick = () => {
    const deadline = Math.floor(
      (Date.now() + 30 * 60 * 1000) / 1000
    ).toString();

    // transfers can also be at most 1 hour in the future.
    const permitTransfer = {
      permitted: {
        token: testTokens.worldchain.USDCE,
        amount: "10000",
      },
      nonce: Date.now().toString(),
      deadline,
    };

    const permitTransferArgsForm = [
      [permitTransfer.permitted.token, permitTransfer.permitted.amount],
      permitTransfer.nonce,
      permitTransfer.deadline,
    ];

    const transferDetails = {
      to: "0x126f7998Eb44Dd2d097A8AB2eBcb28dEA1646AC8",
      requestedAmount: "10000",
    };

    const transferDetailsArgsForm = [
      transferDetails.to,
      transferDetails.requestedAmount,
    ];

    const payload = MiniKit.commands.sendTransaction({
      transaction: [
        {
          address: "0x78c9b378b47c1700838c599e42edd4ffd1865ccd",
          abi: DEXABI,
          functionName: "signatureTransfer",
          args: [
            permitTransferArgsForm,
            transferDetailsArgsForm,
            "PERMIT2_SIGNATURE_PLACEHOLDER_0",
          ],
        },
      ],
      permit2: [
        {
          ...permitTransfer,
          spender: "0x78c9b378b47c1700838c599e42edd4ffd1865ccd",
        },
      ],
    });
    setTempInstallFix((prev) => prev + 1);
    setTransactionData(payload);
  };

  const onSendNestedTransactionClick = () => {
    const deadline = Math.floor(
      (Date.now() + 30 * 60 * 1000) / 1000
    ).toString();

    // transfers can also be at most 1 hour in the future.
    const permitTransfer = {
      permitted: {
        token: testTokens.worldchain.USDCE,
        amount: "10000",
      },
      nonce: Date.now().toString(),
      deadline,
    };
    const permitTransferArgsForm = [
      [permitTransfer.permitted.token, permitTransfer.permitted.amount],
      permitTransfer.nonce,
      permitTransfer.deadline,
    ];

    const permitTransfer2 = {
      permitted: {
        token: testTokens.worldchain.USDCE,
        amount: "20000",
      },
      nonce: deadline,
      deadline,
    };

    const permitTransferArgsForm2 = [
      [permitTransfer2.permitted.token, permitTransfer2.permitted.amount],
      permitTransfer2.nonce,
      permitTransfer2.deadline,
    ];

    const transferDetails = {
      to: "0x126f7998Eb44Dd2d097A8AB2eBcb28dEA1646AC8",
      requestedAmount: "10000",
    };

    const transferDetails2 = {
      to: "0x126f7998Eb44Dd2d097A8AB2eBcb28dEA1646AC8",
      requestedAmount: "20000",
    };

    const transferDetailsArgsForm = [
      transferDetails.to,
      transferDetails.requestedAmount,
    ];

    const transferDetailsArgsForm2 = [
      transferDetails2.to,
      transferDetails2.requestedAmount,
    ];

    const payload = MiniKit.commands.sendTransaction({
      transaction: [
        {
          address: "0x78c9b378b47c1700838c599e42edd4ffd1865ccd",
          abi: DEXABI,
          functionName: "signatureTransfer",
          args: [
            permitTransferArgsForm,
            transferDetailsArgsForm,
            "PERMIT2_SIGNATURE_PLACEHOLDER_0",
          ],
        },
        {
          address: "0x78c9b378b47c1700838c599e42edd4ffd1865ccd",
          abi: DEXABI,
          functionName: "signatureTransfer",
          args: [
            permitTransferArgsForm2,
            transferDetailsArgsForm2,
            "PERMIT2_SIGNATURE_PLACEHOLDER_1",
          ],
        },
      ],
      permit2: [
        {
          ...permitTransfer,
          spender: "0x78c9b378b47c1700838c599e42edd4ffd1865ccd",
        },
        {
          ...permitTransfer2,
          spender: "0x78c9b378b47c1700838c599e42edd4ffd1865ccd",
        },
      ],
    });
    setTempInstallFix((prev) => prev + 1);
    setTransactionData(payload);
  };

  const testNFTPurchase = () => {
    const deadline = Math.floor(
      (Date.now() + 30 * 60 * 1000) / 1000
    ).toString();

    // transfers can also be at most 1 hour in the future.
    const permitTransfer = {
      permitted: {
        token: testTokens.worldchain.USDCE,
        amount: "1000000",
      },
      nonce: Date.now().toString(),
      deadline,
    };
    const permitTransferArgsForm = [
      [permitTransfer.permitted.token, permitTransfer.permitted.amount],
      permitTransfer.nonce,
      permitTransfer.deadline,
    ];

    const transferDetails = {
      to: "0x640487Ce2c45bD05D03b65783c15aa1ac694cDb6",
      requestedAmount: "1000000",
    };

    const transferDetailsArgsForm = [
      transferDetails.to,
      transferDetails.requestedAmount,
    ];

    const payload = MiniKit.commands.sendTransaction({
      transaction: [
        {
          address: "0x640487Ce2c45bD05D03b65783c15aa1ac694cDb6",
          abi: ANDYABI,
          functionName: "buyNFTWithPermit2",
          args: [
            permitTransferArgsForm,
            transferDetailsArgsForm,
            "PERMIT2_SIGNATURE_PLACEHOLDER_0",
          ],
        },
      ],
      permit2: [
        {
          ...permitTransfer,
          spender: "0x640487Ce2c45bD05D03b65783c15aa1ac694cDb6",
        },
      ],
    });
    setTempInstallFix((prev) => prev + 1);
    setTransactionData(payload);
  };

  return (
    <div className="grid gap-y-2">
      <h2 className="text-2xl font-bold">Transaction</h2>
      <div className="grid gap-y-1">
        <p>Raw string:</p>

        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-break-spaces max-h-[300px] overflow-y-scroll">
            {transactionData
              ? JSON.stringify(transactionData, null, 3)
              : JSON.stringify(null)}
          </pre>
        </div>
      </div>
      <div className="grid gap-x-2 grid-cols-2">
        <button
          className="bg-black text-white rounded-lg p-4 w-full"
          onClick={onSendTransactionClick}
        >
          Send Transaction
        </button>

        <button
          className="bg-black text-white rounded-lg p-4 w-full"
          onClick={onSendNestedTransactionClick}
        >
          Send Nested Transaction
        </button>
      </div>
      <div className="grid gap-x-2 grid-cols-2">
        <button
          className="bg-black text-white rounded-lg p-4 w-full"
          onClick={testNFTPurchase}
        >
          Purchase NFT Permit2
        </button>
      </div>

      <div className="grid gap-y-1">
        <p>
          Received from &quot;{ResponseEvent.MiniAppSendTransaction}&quot;:{" "}
        </p>
        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-break-spaces">
            {JSON.stringify(receivedSendTransactionPayload, null, 2)}
          </pre>
        </div>

        <div className="grid gap-y-1">
          <p>Validation message:</p>
          <p className="bg-gray-300 p-2">
            {sendTransactionPayloadValidationMessage ?? "No validation"}
          </p>
        </div>

        <div className="grid gap-y-1">
          <p>Verification:</p>
          <p className="bg-gray-300 p-2">
            {/* {sendTransactionVerificationMessage ?? "No verification yet"} */}
            {transactionId && <p>Transaction ID: {transactionId}</p>}
            {isConfirming && <p>Waiting for confirmation...</p>}
            {isConfirmed && <p>Transaction confirmed.</p>}
          </p>
        </div>
      </div>
    </div>
  );
};
