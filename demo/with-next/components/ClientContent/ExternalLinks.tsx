import Link from "next/link";

export const ExternalLinks = () => {
  return (
    <>
      <p className="text-xl font-bold">Test External Links</p>
      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href="https://worldcoin.org/apps"
          className="bg-green-500 text-white text-center rounded-lg p-3"
        >
          Valid Associated Domain (Link)
        </Link>
        <button
          onClick={() => window.open("https://worldcoin.org/apps")}
          className="text-white bg-green-500 hover:bg-blue-300 transition p-4 leading-[1] rounded-lg"
        >
          Valid Associated Domain (Button)
        </button>
        <Link
          href="https://whitepaper.worldcoin.org"
          className="bg-green-500 text-white text-center rounded-lg p-3"
        >
          Valid Subdomain (Link)
        </Link>
        <button
          onClick={() => window.open("https://whitepaper.worldcoin.org")}
          className="text-white bg-green-500 transition p-4 leading-[1] rounded-lg"
        >
          Valid Subdomain (Button)
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
