/**
 * Shared globalThis keys used to coordinate state across MiniKit entry points
 * without requiring static imports between them (which would couple modules
 * and pull optional peer deps into unrelated bundles).
 */

/** wagmi Config stored by the fallback adapter, read by wagmi fallback commands. */
export const WAGMI_CONFIG_KEY = '__minikit_wagmi_config__' as const;

/**
 * Install hook set by `wagmi-fallback.ts` as a side effect. MiniKitProvider
 * calls this to register a wagmi Config without statically importing the
 * wagmi-fallback module.
 */
export const WAGMI_INSTALL_HOOK_KEY =
  '__minikit_install_wagmi_fallback__' as const;
