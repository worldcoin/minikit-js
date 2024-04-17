"use client";

import { useEffect, useState } from "react";
// import { MiniKit, ResponseEvent } from "@/worldcoin/minikit-js";

// const Home = () => {
//   const [messageFromApp, setMessageFromApp] = useState<string | undefined>();

//   useEffect(() => {
//     if (!MiniKit.isInstalled()) {
//       return;
//     }

//     MiniKit.subscribe(ResponseEvent.MiniAppVerifyAction, (payload) => {
//       console.log("MiniAppVerifyAction, SUBSCRIBE PAYLOAD", payload);
//       setMessageFromApp(JSON.stringify(payload, null, 2));
//     });

//     return () => {
//       MiniKit.unsubscribe(ResponseEvent.MiniAppVerifyAction);
//     };
//   }, []);

//   return (
//     <div className="p-8 grid grid-rows-[auto_1fr_auto] min-h-[100dvh]">
//       <header className="flex w-full justify-end">
//         <button
//           onClick={() => MiniKit.commands.closeWebview()}
//           className="border border-black p-2 hover:bg-gray-200"
//         >
//           Close WebView [X]
//         </button>
//       </header>

//       <div>
//         <h1>Minikit V1</h1>
//         <h2 className="mt-8">Buttons: </h2>

//         <div className="grid gap-y-2">
//           <button
//             className="bg-black text-white rounded-lg p-4 w-full"
//             onClick={() => {
//               MiniKit.commands.verify({
//                 app_id: "app_...",
//                 action: "action identifier",
//                 signal: "signal",
//                 verification_level: "orb|device",
//                 timestamp: new Date().toISOString(),
//               });
//             }}
//           >
//             Send verify
//           </button>

//           <button
//             className="bg-black text-white rounded-lg p-4 w-full"
//             onClick={() => {
//               MiniKit.commands.pay({
//                 to: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
//                 from: "0x6235379BAf4644cCBd22e9F6C53D35a1CF727D4C",
//                 value: 200.13,
//                 network: "optimism",
//                 token_address: "0x163f8C2467924be0ae7B5347228CABF260318753",
//                 token: "wld",
//                 memo: "12312",
//                 timestamp: new Date().toISOString(),
//               });
//             }}
//           >
//             Send pay
//           </button>

//           <button
//             className="bg-black text-white rounded-lg p-4 w-full"
//             onClick={() => {
//               sendWebviewEvent<{ command: string }>({
//                 command: "trigger",
//               });
//             }}
//           >
//             Trigger message from the app
//           </button>
//         </div>
//       </div>

//       <div>
//         <p>Message from the app: </p>

//         <pre>{messageFromApp}</pre>
//       </div>
//     </div>
//   );
// };

const Home = () => {
  return <div></div>
}
export default Home;
