import type { FallbackConfig } from '../types';

export type CloseMiniAppResult = {
  status: 'success';
  version: number;
};

export interface MiniKitCloseMiniAppOptions<
  TCustomFallback = CloseMiniAppResult,
> extends FallbackConfig<TCustomFallback> {}
