export enum MiniKitInstallErrorCodes {
  Unknown = 'unknown',
  AlreadyInstalled = 'already_installed',
  OutsideOfWorldApp = 'outside_of_worldapp',
  NotOnClient = 'not_on_client',
  AppOutOfDate = 'app_out_of_date',
}

export const MiniKitInstallErrorMessage = {
  [MiniKitInstallErrorCodes.Unknown]: 'Failed to install MiniKit.',
  [MiniKitInstallErrorCodes.AlreadyInstalled]: 'MiniKit is already installed.',
  [MiniKitInstallErrorCodes.OutsideOfWorldApp]:
    'MiniApp launched outside of WorldApp.',
  [MiniKitInstallErrorCodes.NotOnClient]: 'Window object is not available.',
  [MiniKitInstallErrorCodes.AppOutOfDate]:
    'WorldApp is out of date. Please update the app.',
};
