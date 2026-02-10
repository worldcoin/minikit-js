import { VerificationLevel } from '@worldcoin/idkit-core';
import { ResponseEvent } from '../commands/types';
import type { MiniAppVerifyActionPayload } from '../commands/verify';
import { EventManager } from '../core/events';
import { compressAndPadProof } from '../helpers/proof';

jest.mock('../helpers/proof', () => ({
  compressAndPadProof: jest.fn(),
}));

const mockedCompressAndPadProof = compressAndPadProof as jest.MockedFunction<
  typeof compressAndPadProof
>;

const flushAsync = () => new Promise<void>((resolve) => setImmediate(resolve));

describe('EventManager verify-action payload handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('still calls listener when single payload proof compression fails', async () => {
    mockedCompressAndPadProof.mockRejectedValueOnce(
      new Error('compression failed'),
    );
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const manager = new EventManager();
    const handler = jest.fn();
    manager.subscribe(ResponseEvent.MiniAppVerifyAction, handler);

    const payload: MiniAppVerifyActionPayload = {
      status: 'success',
      version: 1,
      proof: '0x1234',
      merkle_root: '0x1',
      nullifier_hash: '0x2',
      verification_level: VerificationLevel.Orb,
    };

    manager.trigger(ResponseEvent.MiniAppVerifyAction, payload);
    await flushAsync();

    expect(handler).toHaveBeenCalledWith(payload);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to compress verification proof. Delivering payload with uncompressed proof.',
      expect.objectContaining({
        mode: 'single',
        payloadVersion: 1,
        verificationLevel: VerificationLevel.Orb,
      }),
    );
  });

  it('still calls listener when multi payload proof compression fails', async () => {
    mockedCompressAndPadProof.mockRejectedValueOnce(
      new Error('compression failed'),
    );
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const manager = new EventManager();
    const handler = jest.fn();
    manager.subscribe(ResponseEvent.MiniAppVerifyAction, handler);

    const payload: MiniAppVerifyActionPayload = {
      status: 'success',
      version: 1,
      verifications: [
        {
          proof: '0x1234',
          merkle_root: '0x1',
          nullifier_hash: '0x2',
          verification_level: VerificationLevel.Orb,
        },
        {
          proof: '0x5678',
          merkle_root: '0x3',
          nullifier_hash: '0x4',
          verification_level: VerificationLevel.Device,
        },
      ],
    };

    manager.trigger(ResponseEvent.MiniAppVerifyAction, payload);
    await flushAsync();

    expect(handler).toHaveBeenCalledWith(payload);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to compress verification proof. Delivering payload with uncompressed proof.',
      expect.objectContaining({
        mode: 'multi',
        payloadVersion: 1,
        verificationsCount: 2,
        verificationLevel: VerificationLevel.Orb,
      }),
    );
  });
});
