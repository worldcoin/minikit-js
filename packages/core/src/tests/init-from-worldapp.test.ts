// Mock setupMicrophone to avoid browser API dependencies
jest.mock('../helpers/microphone', () => ({
  setupMicrophone: jest.fn(),
}));

import { MiniKit } from '../minikit';
import { MiniAppLaunchLocation } from '../types';

function makeWorldApp(
  overrides: Partial<NonNullable<typeof window.WorldApp>> = {},
): NonNullable<typeof window.WorldApp> {
  return {
    world_app_version: 4001000,
    device_os: 'ios',
    is_optional_analytics: true,
    supported_commands: [
      { name: 'verify' as any, supported_versions: [1] },
      { name: 'wallet-auth' as any, supported_versions: [1, 2] },
      { name: 'pay' as any, supported_versions: [1] },
      { name: 'sign-message' as any, supported_versions: [1] },
      { name: 'sign-typed-data' as any, supported_versions: [1] },
      { name: 'send-transaction' as any, supported_versions: [1, 2] },
      { name: 'share-contacts' as any, supported_versions: [1] },
      { name: 'request-permission' as any, supported_versions: [1] },
      { name: 'get-permissions' as any, supported_versions: [1] },
      { name: 'send-haptic-feedback' as any, supported_versions: [1] },
      { name: 'share' as any, supported_versions: [1] },
      { name: 'chat' as any, supported_versions: [1] },
      { name: 'close-miniapp' as any, supported_versions: [1] },
      { name: 'attestation' as any, supported_versions: [1] },
    ],
    safe_area_insets: { top: 47, right: 0, bottom: 34, left: 0 },
    verification_status: {
      is_orb_verified: true,
      is_document_verified: true,
      is_secure_document_verified: false,
    },
    wallet_address: '0x377da9cab87c04a1d6f19d8b4be9aef8df26fcdd',
    preferred_currency: 'USD',
    pending_notifications: 3,
    location: { open_origin: 'deeplink' },
    ...overrides,
  };
}

describe('MiniKit.install – initFromWorldApp mapping', () => {
  let originalWindow: unknown;

  beforeEach(() => {
    originalWindow = (global as any).window;
    (global as any).window = {};
  });

  afterEach(() => {
    (global as any).window = originalWindow;
    MiniKit.user = {};
    jest.restoreAllMocks();
  });

  it('maps all WorldApp fields to MiniKit state', () => {
    (global as any).window.WorldApp = makeWorldApp();

    const result = MiniKit.install('app_test');
    expect(result.success).toBe(true);

    expect(MiniKit.user.optedIntoOptionalAnalytics).toBe(true);
    expect(MiniKit.user.preferredCurrency).toBe('USD');
    expect(MiniKit.user.pendingNotifications).toBe(3);
    expect(MiniKit.user.walletAddress).toBe(
      '0x377da9cab87c04a1d6f19d8b4be9aef8df26fcdd',
    );
    expect(MiniKit.user.verificationStatus).toEqual({
      isOrbVerified: true,
      isDocumentVerified: true,
      isSecureDocumentVerified: false,
    });

    expect(MiniKit.deviceProperties.worldAppVersion).toBe(4001000);
    expect(MiniKit.deviceProperties.deviceOS).toBe('ios');
    expect(MiniKit.deviceProperties.safeAreaInsets).toEqual({
      top: 47,
      right: 0,
      bottom: 34,
      left: 0,
    });

    expect(MiniKit.location).toBe(MiniAppLaunchLocation.DeepLink);
  });

  it('handles legacy string location', () => {
    (global as any).window.WorldApp = makeWorldApp({
      location: 'app-store' as any,
    });

    MiniKit.install('app_test');
    expect(MiniKit.location).toBe(MiniAppLaunchLocation.AppStore);
  });

  it('handles missing optional fields gracefully', () => {
    (global as any).window.WorldApp = makeWorldApp({
      verification_status: undefined,
      wallet_address: undefined,
      preferred_currency: undefined,
      pending_notifications: undefined,
      location: null,
    });

    const result = MiniKit.install('app_test');
    expect(result.success).toBe(true);

    expect(MiniKit.user.verificationStatus).toBeUndefined();
    expect(MiniKit.user.walletAddress).toBeUndefined();
    expect(MiniKit.user.preferredCurrency).toBeUndefined();
    expect(MiniKit.user.pendingNotifications).toBeUndefined();
    expect(MiniKit.location).toBeNull();
  });

  it('re-install clears stale user state from previous install', () => {
    // First install with full payload
    (global as any).window.WorldApp = makeWorldApp();
    MiniKit.install('app_test');

    expect(MiniKit.user.walletAddress).toBe(
      '0x377da9cab87c04a1d6f19d8b4be9aef8df26fcdd',
    );
    expect(MiniKit.user.verificationStatus).toBeDefined();

    // Second install (e.g. HMR) with payload missing wallet/verification
    (global as any).window.WorldApp = makeWorldApp({
      wallet_address: undefined,
      verification_status: undefined,
    });
    MiniKit.install('app_test');

    expect(MiniKit.user.walletAddress).toBeUndefined();
    expect(MiniKit.user.verificationStatus).toBeUndefined();
  });
});
