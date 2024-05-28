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
          External Link (Link)
        </Link>
        <button
          onClick={() => window.open("https://worldcoin.org/apps")}
          className="text-white bg-green-500 hover:bg-blue-300 transition p-4 leading-[1] rounded-lg"
        >
          External Link (Button)
        </button>
      </div>
    </>
  );
};
