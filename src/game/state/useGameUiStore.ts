import { create } from 'zustand';

type GameUiState = {
  physicsDebug: boolean;
  togglePhysicsDebug: () => void;
};

export const useGameUiStore = create<GameUiState>((set) => ({
  physicsDebug: false,
  togglePhysicsDebug: () => set((state) => ({ physicsDebug: !state.physicsDebug })),
}));
