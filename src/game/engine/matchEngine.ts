export type WrestlerSide = 'player' | 'opponent';

export type WrestlerCondition = {
  health: number;
  stamina: number;
  momentum: number;
};

export type MatchState = {
  phase: 'ready' | 'active' | 'finished';
  player: WrestlerCondition;
  opponent: WrestlerCondition;
};

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

export function createInitialMatchState(): MatchState {
  return {
    phase: 'ready',
    player: { health: 100, stamina: 100, momentum: 0 },
    opponent: { health: 100, stamina: 100, momentum: 0 },
  };
}

export function startMatch(state: MatchState): MatchState {
  return { ...state, phase: 'active' };
}

export function applyDamage(state: MatchState, target: WrestlerSide, amount: number): MatchState {
  if (amount < 0) {
    throw new RangeError('Damage must be zero or greater.');
  }

  const current = state[target];
  return {
    ...state,
    [target]: {
      ...current,
      health: clampPercent(current.health - amount),
    },
  };
}
