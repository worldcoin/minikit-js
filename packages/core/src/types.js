// ============================================================================
// Core Domain Types
// ============================================================================
export var MiniAppLaunchLocation;
(function (MiniAppLaunchLocation) {
  MiniAppLaunchLocation['Chat'] = 'chat';
  MiniAppLaunchLocation['Home'] = 'home';
  MiniAppLaunchLocation['AppStore'] = 'app-store';
  MiniAppLaunchLocation['DeepLink'] = 'deep-link';
  MiniAppLaunchLocation['WalletTab'] = 'wallet-tab';
})(MiniAppLaunchLocation || (MiniAppLaunchLocation = {}));
// ============================================================================
// Install
// ============================================================================
export var MiniKitInstallErrorCodes;
(function (MiniKitInstallErrorCodes) {
  MiniKitInstallErrorCodes['Unknown'] = 'unknown';
  MiniKitInstallErrorCodes['AlreadyInstalled'] = 'already_installed';
  MiniKitInstallErrorCodes['OutsideOfWorldApp'] = 'outside_of_worldapp';
  MiniKitInstallErrorCodes['NotOnClient'] = 'not_on_client';
  MiniKitInstallErrorCodes['AppOutOfDate'] = 'app_out_of_date';
})(MiniKitInstallErrorCodes || (MiniKitInstallErrorCodes = {}));
export const MiniKitInstallErrorMessage = {
  [MiniKitInstallErrorCodes.Unknown]: 'Failed to install MiniKit.',
  [MiniKitInstallErrorCodes.AlreadyInstalled]: 'MiniKit is already installed.',
  [MiniKitInstallErrorCodes.OutsideOfWorldApp]:
    'MiniApp launched outside of WorldApp.',
  [MiniKitInstallErrorCodes.NotOnClient]: 'Window object is not available.',
  [MiniKitInstallErrorCodes.AppOutOfDate]:
    'WorldApp is out of date. Please update the app.',
};
