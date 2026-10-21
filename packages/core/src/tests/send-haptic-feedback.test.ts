import type { SendHapticFeedbackInput } from '../commands/send-haptic-feedback';

describe('SendHapticFeedbackInput', () => {
  it.each(['soft', 'rigid'] as const)(
    'accepts the %s impact style',
    (style) => {
      const input: SendHapticFeedbackInput = {
        hapticsType: 'impact',
        style,
      };

      expect(input.style).toBe(style);
    },
  );
});
