'use client';

import { useEnvironment } from '@/providers';

/**
 * Shows which environment is detected and which transport paths are available.
 * This is the key visual indicator for the "mini app <-> web" flow demo.
 */
export function EnvironmentBanner() {
  const env = useEnvironment();

  if (env === 'loading') {
    return (
      <div className="rounded-lg border border-border bg-card p-4 animate-pulse">
        <div className="h-5 w-48 bg-border rounded" />
      </div>
    );
  }

  const isNative = env === 'world-app';

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span
          className={`inline-block w-3 h-3 rounded-full ${isNative ? 'bg-success' : 'bg-accent'}`}
        />
        <span className="font-semibold text-lg">
          {isNative ? 'World App (Native)' : 'Web Browser'}
        </span>
      </div>

      <div className="text-sm text-muted space-y-1">
        <p>Transport paths available for each command:</p>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="py-1 pr-2 font-medium">Command</th>
              <th className="py-1 px-2 font-medium">Native</th>
              <th className="py-1 px-2 font-medium">Wagmi</th>
              <th className="py-1 pl-2 font-medium">Fallback</th>
            </tr>
          </thead>
          <tbody>
            <Row
              command="verify"
              native={isNative}
              wagmi={false}
              fallback="QR + polling (IDKit bridge)"
            />
            <Row
              command="walletAuth"
              native={isNative}
              wagmi={!isNative}
              fallback="Custom SIWE"
            />
            <Row
              command="sendTransaction"
              native={isNative}
              wagmi={!isNative}
              fallback="Custom"
            />
            <Row
              command="pay"
              native={isNative}
              wagmi={false}
              fallback="Required on web"
            />
            <Row
              command="shareContacts"
              native={isNative}
              wagmi={false}
              fallback="Required on web"
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({
  command,
  native,
  wagmi,
  fallback,
}: {
  command: string;
  native: boolean;
  wagmi: boolean;
  fallback: string;
}) {
  return (
    <tr className="border-b border-border/50">
      <td className="py-1 pr-2 font-mono">{command}</td>
      <td className="py-1 px-2">{native ? '✓' : '-'}</td>
      <td className="py-1 px-2">{wagmi ? '✓' : '-'}</td>
      <td className="py-1 pl-2 text-muted">{fallback}</td>
    </tr>
  );
}
