export const views = ['Front', 'Rear', 'Left', 'Right', 'Three-quarter'] as const;
export type View = (typeof views)[number];
