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
          onClick={() => window.open("https://worldcoin.org/world-chain")}
          className="text-white bg-green-500 hover:bg-blue-300 transition p-4 leading-[1] rounded-lg"
        >
          Valid Associated Domain (Button)
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
          href="https://worldcoin-developer-portal.eu.auth0.com/u/login/identifier?state=hKFo2SBHakd3VGFGMllRb0E4QVJMY3pDeS04VG5lWGNwTFVkdKFur3VuaXZlcnNhbC1sb2dpbqN0aWTZIEpFNTd0NjdIOTZLVzdVMG5FVXdrQ0dHUV92dHVwaE1ho2NpZNkgbU1vVGJqbFI4RmZYVEJrU05nVzk3d1BxR2tmUmNWUk8"
          className="bg-green-500 text-white text-center rounded-lg p-3"
        >
          Valid double Subdomain (Link)
        </Link>
        <button
          onClick={() =>
            window.open(
              "https://worldcoin-developer-portal.eu.auth0.com/u/login/identifier?state=hKFo2SBHakd3VGFGMllRb0E4QVJMY3pDeS04VG5lWGNwTFVkdKFur3VuaXZlcnNhbC1sb2dpbqN0aWTZIEpFNTd0NjdIOTZLVzdVMG5FVXdrQ0dHUV92dHVwaE1ho2NpZNkgbU1vVGJqbFI4RmZYVEJrU05nVzk3d1BxR2tmUmNWUk8"
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
