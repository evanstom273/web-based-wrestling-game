import { describe, expect, it } from 'vitest';
import { applyDamage, createInitialMatchState, startMatch } from './matchEngine';

describe('matchEngine foundation', () => {
  it('creates deterministic clean match state', () => {
    expect(createInitialMatchState()).toEqual({
      phase: 'ready',
      player: { health: 100, stamina: 100, momentum: 0 },
      opponent: { health: 100, stamina: 100, momentum: 0 },
    });
  });

  it('starts a match without mutating the source snapshot', () => {
    const initial = createInitialMatchState();
    const active = startMatch(initial);

    expect(initial.phase).toBe('ready');
    expect(active.phase).toBe('active');
  });

  it('clamps damage at zero health', () => {
    const state = applyDamage(createInitialMatchState(), 'opponent', 140);
    expect(state.opponent.health).toBe(0);
  });

  it('rejects negative damage', () => {
    expect(() => applyDamage(createInitialMatchState(), 'player', -1)).toThrow(RangeError);
  });
});
