import Link from 'next/link';

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
        <Link
          href="worldapp://mini-app?app_id=app_staging_e387587d26a286fb5bea1d436ba0b2a3&path=features"
          className="bg-green-500 text-white text-center rounded-lg p-3"
        >
          worldapp:// deep link
        </Link>
        <Link
          href="worldapp://mini-app?app_id=app-store&path=explore?collection_id=top_games"
          className="bg-green-500 text-white text-center rounded-lg p-3"
        >
          worldapp:// games tab collection deep link
        </Link>
        <Link
          href="worldapp://mini-app?app_id=app-store&path=explore?collection_id=must_have_apps"
          className="bg-green-500 text-white text-center rounded-lg p-3"
        >
          worldapp:// apps tab collection deep link
        </Link>
        <button
          onClick={() => {
            window.open(
              'https://worldcoin.org/app-store/explore-tab?collection_id=top_games',
              '_blank',
            );
          }}
          className="text-white bg-green-500 hover:bg-blue-300 transition p-4 leading-[1] rounded-lg"
        >
          world.org Games Collection Deep Link
        </button>
        <button
          onClick={() => {
            window.open(
              'https://worldcoin.org/app-store/explore-tab?collection_id=new_and_noteworthy',
              '_blank',
            );
          }}
          className="text-white bg-green-500 hover:bg-blue-300 transition p-4 leading-[1] rounded-lg"
        >
          world.org Apps Collection Deep Link
        </button>
        <button
          onClick={() => {
            window.open(
              'https://world.org/mini-app?app_id=app_staging_e387587d26a286fb5bea1d436ba0b2a3&path=features',
              '_blank',
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
          onClick={() => window.open('https://docs.worldcoin.org')}
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
              'https://worldcoin-developer-portal.eu.auth0.com/u/login/identifier',
            )
          }
          className="text-white bg-green-500 transition p-4 leading-[1] rounded-lg"
        >
          Valid double subdomain (Button)
        </button>

        <button
          onClick={() => navigator.share({ url: 'https://google.com' })}
          className="text-white bg-green-500 transition p-4 leading-[1] rounded-lg"
        >
          Open Share Page
        </button>
        <button
          onClick={() =>
            window.open(
              'https://docs.worldcoin.org?open_out_of_window=true',
              '_blank',
            )
          }
          className="text-white bg-green-500 transition p-4 leading-[1] rounded-lg"
        >
          Open Outside App
        </button>
        <button
          onClick={async () => {
            try {
              const response = await fetch('/800.jpeg');
              const blob = await response.blob();
              const file = new File([blob], '800.jpeg', { type: 'image/jpeg' });
              await navigator.share({
                url: 'https://google.com',
                files: [file],
              });
            } catch (error) {
              console.error('Error sharing:', error);
            }
          }}
          className="text-white bg-green-500 transition p-4 leading-[1] rounded-lg"
        >
          Share Image
        </button>
        <button
          onClick={() => window.open('https://google.com', '_blank')}
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
