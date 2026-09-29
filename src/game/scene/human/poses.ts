import type { HumanRig } from './rig';
export const poses = ['Neutral', 'Guard', 'Reach', 'Squat', 'Stride'] as const;
export type Pose = (typeof poses)[number];
export type PoseSettings = {
  pose: Pose;
  amount: number;
  playing: boolean;
  phase: number;
  fists: number;
  skeleton: boolean;
};
export const defaultPose: PoseSettings = {
  pose: 'Neutral',
  amount: 1,
  playing: false,
  phase: 0,
  fists: 0.15,
  skeleton: false,
};
/** Presentation-only joint study. No inputs, collisions or match outcomes. Angles are radians. */
export function applyPose(rig: HumanRig, settings: PoseSettings, time: number) {
  rig.bones.forEach((bone) => bone.rotation.set(0, 0, 0));
  rig.root.position.copy(rig.rest.get('pelvis')!);
  const wave = Math.sin((settings.playing ? time * 0.65 : settings.phase) * Math.PI * 2);
  const amount = settings.amount;
  const turn = (name: string, x = 0, y = 0, z = 0) =>
    rig.bones[rig.names.get(name)!]!.rotation.set(x * amount, y * amount, z * amount);
  for (const side of [-1, 1]) {
    const s = side < 0 ? 'L' : 'R';
    turn(`${s}fingers`, -settings.fists * 1.2);
    turn(`${s}fingerTips`, -settings.fists * 1.1);
    turn(`${s}thumb`, -settings.fists * 0.45, 0, side * settings.fists * 0.25);
    if (settings.pose === 'Guard') {
      turn(`${s}clavicle`, 0, 0, side * 0.07);
      turn(`${s}upperArm`, -0.55 + wave * 0.025, side * 0.12, -side * 0.08);
      turn(`${s}forearm`, -1.8);
      turn(`${s}hand`, 0.12, side * 0.5);
      turn('chest', 0.07);
    } else if (settings.pose === 'Reach') {
      turn(`${s}clavicle`, 0, 0, side * 0.18);
      turn(`${s}upperArm`, -0.55, 0, side * (0.8 + wave * 0.15));
      turn(`${s}forearm`, -0.28);
      turn('head', 0, wave * 0.2);
    } else if (settings.pose === 'Squat') {
      const bend = 0.55 + wave * 0.15;
      turn(`${s}thigh`, -bend);
      turn(`${s}shin`, bend * 1.85);
      turn(`${s}foot`, -bend * 0.85);
      turn(`${s}upperArm`, -0.65);
      turn(`${s}forearm`, -0.7);
      turn('spine', 0.16);
    } else if (settings.pose === 'Stride') {
      turn(`${s}thigh`, side * wave * 0.38);
      turn(`${s}shin`, Math.max(0, -side * wave) * 0.5);
      turn(`${s}foot`, -Math.max(0, -side * wave) * 0.25);
      turn(`${s}upperArm`, -side * wave * 0.3);
      turn(`${s}forearm`, -0.2);
      turn('chest', 0, wave * 0.06);
    } else if (settings.playing) {
      turn('chest', wave * 0.009);
      turn(`${s}upperArm`, wave * 0.015);
    }
  }
  rig.root.updateMatrixWorld(true);
  rig.skeleton.update();
}
