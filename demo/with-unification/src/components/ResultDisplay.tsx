'use client';

/**
 * Shared component to display command results with the transport path indicator.
 * The `via` field comes from CommandResult<T>.via: 'minikit' | 'wagmi' | 'fallback'
 */
export function ResultDisplay({
  via,
  data,
  error,
}: {
  via?: string;
  data?: unknown;
  error?: string;
}) {
  if (error) {
    return (
      <div className="mt-3 rounded-md bg-error/10 border border-error/30 p-3 text-sm">
        <span className="font-semibold text-error">Error: </span>
        <span className="text-error/80">{error}</span>
      </div>
    );
  }

  if (!data && !via) return null;

  const viaColors: Record<string, string> = {
    minikit: 'bg-success text-white',
    wagmi: 'bg-accent text-white',
    fallback: 'bg-warning text-black',
  };

  return (
    <div className="mt-3 rounded-md bg-card border border-border p-3 text-sm space-y-2">
      {via && (
        <div className="flex items-center gap-2">
          <span className="text-muted text-xs uppercase tracking-wide">
            via
          </span>
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${viaColors[via] ?? 'bg-border'}`}
          >
            {via}
          </span>
        </div>
      )}
      {data != null ? (
        <pre className="text-xs text-muted overflow-x-auto whitespace-pre-wrap break-all">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
