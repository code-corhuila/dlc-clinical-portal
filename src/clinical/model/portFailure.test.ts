import { describe, expect, it } from 'vitest';
import { portFailureMessage } from './portFailure';

describe('portFailureMessage', () => {
  it('shows the message of a typed port failure', () => {
    expect(
      portFailureMessage(
        { code: 'CONFLICT', message: 'Atención cerrada' },
        'x',
      ),
    ).toBe('Atención cerrada');
  });

  it.each([
    ['a technical Error', new Error('stack detail')],
    ['an untyped object', { message: 'internal' }],
    ['a string', 'boom'],
    ['null', null],
  ])('uses the fallback for %s', (_, error) => {
    expect(portFailureMessage(error, 'Mensaje seguro')).toBe('Mensaje seguro');
  });
});
