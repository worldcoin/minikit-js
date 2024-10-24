import Link from "next/link";

export const ExternalLinks = () => {
  return (
    <>
      <p className="text-xl font-bold">Test External Links</p>
      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href="https://worldcoin.org/world-chain"
          className="bg-green-500 text-white text-center rounded-lg p-3"
        >
          Valid Associated Domain (Link)
        </Link>
        <button
          onClick={() => {
            window.open(
              "https://worldcoin.org/mini-app?app_id=app_staging_d3b49eb04b497130e18533b9d8846319",
              "_blank"
            );
          }}
          className="text-white bg-green-500 hover:bg-blue-300 transition p-4 leading-[1] rounded-lg"
        >
          Internal Deep Link Test
        </button>
        <Link
          href="https://docs.worldcoin.org"
          className="bg-green-500 text-white text-center rounded-lg p-3"
        >
          Valid Subdomain (Link)
        </Link>
        <button
          onClick={() => window.open("https://docs.worldcoin.org")}
          className="text-white bg-green-500 transition p-4 leading-[1] rounded-lg"
        >
          Valid Subdomain (Button)
        </button>
        <Link
          href="https://worldcoin-developer-portal.eu.auth0.com/u/login/identifier"
          className="bg-green-500 text-white text-center rounded-lg p-3"
        >
          Valid double Subdomain (Link)
        </Link>
        <button
          onClick={() =>
            window.open(
              "https://worldcoin-developer-portal.eu.auth0.com/u/login/identifier"
            )
          }
          className="text-white bg-green-500 transition p-4 leading-[1] rounded-lg"
        >
          Valid double subdomain (Button)
        </button>

        <button
          onClick={() => window.open("https://google.com", "_blank")}
          className="text-white bg-red-500 transition p-4 leading-[1] rounded-lg"
        >
          Invalid External Link (Button)
        </button>
        <Link
          href="https://google.com"
          className="bg-red-500 text-white text-center rounded-lg p-3"
        >
          Invalid External Link (Link)
        </Link>
      </div>
    </>
  );
};
