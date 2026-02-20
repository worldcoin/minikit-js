import { ResponseEvent } from '../commands/types';
import type { MiniAppVerifyActionPayload } from '../commands/verify';
import { EventManager } from '../core/events';
import { compressAndPadProof } from '../helpers/proof';
import { VerificationLevel } from '../types/verification-level';

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

  it('skips single payload proof compression when enabled with snake_case option', async () => {
    const manager = new EventManager();
    const handler = jest.fn();
    manager.subscribe(ResponseEvent.MiniAppVerifyAction, handler);
    manager.setVerifyActionProcessingOptions({
      skip_proof_compression: true,
    });

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
    expect(mockedCompressAndPadProof).not.toHaveBeenCalled();
  });

  it('skips multi payload proof compression when enabled with snake_case option', async () => {
    const manager = new EventManager();
    const handler = jest.fn();
    manager.subscribe(ResponseEvent.MiniAppVerifyAction, handler);
    manager.setVerifyActionProcessingOptions({
      skip_proof_compression: true,
    });

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
    expect(mockedCompressAndPadProof).not.toHaveBeenCalled();
  });

  it('associates queued processing options with each verify response', async () => {
    mockedCompressAndPadProof.mockResolvedValueOnce('0xbeef' as `0x${string}`);
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const manager = new EventManager();
    const handler = jest.fn();
    manager.subscribe(ResponseEvent.MiniAppVerifyAction, handler);

    manager.setVerifyActionProcessingOptions({
      skip_proof_compression: true,
    });
    manager.setVerifyActionProcessingOptions({
      skip_proof_compression: false,
    });

    const firstPayload: MiniAppVerifyActionPayload = {
      status: 'success',
      version: 1,
      proof: '0x1234',
      merkle_root: '0x1',
      nullifier_hash: '0x2',
      verification_level: VerificationLevel.Orb,
    };

    manager.trigger(ResponseEvent.MiniAppVerifyAction, firstPayload);
    await flushAsync();

    expect(handler).toHaveBeenCalledWith(firstPayload);
    expect(firstPayload.proof).toBe('0x1234');
    expect(mockedCompressAndPadProof).not.toHaveBeenCalled();
    const secondPayload: MiniAppVerifyActionPayload = {
      status: 'success',
      version: 1,
      proof: '0x5678',
      merkle_root: '0x3',
      nullifier_hash: '0x4',
      verification_level: VerificationLevel.Orb,
    };

    manager.trigger(ResponseEvent.MiniAppVerifyAction, secondPayload);
    await flushAsync();

    expect(handler).toHaveBeenCalledWith(secondPayload);
    expect(handler).toHaveBeenCalledTimes(2);
    expect(secondPayload.proof).toBe('0xbeef');
    expect(mockedCompressAndPadProof).toHaveBeenCalledTimes(1);
    expect(mockedCompressAndPadProof).toHaveBeenCalledWith('0x5678');
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('No handler for event miniapp-verify-action'),
    );
  });
});
