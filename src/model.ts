export type Furniture = 'chair' | 'couch' | 'pedestal';
export type Pose = 'proper' | 'heir' | 'sideways' | 'gargoyle';
export type Configuration = {
  furniture: Furniture;
  pose: Pose;
  lean: number;
  offsetX: number;
  offsetZ: number;
  rotation: number;
};
export type TrialResult = {
  status: 'supported' | 'fallen' | 'unsupported';
  seconds: number;
};
export type SceneProps = {
  config: Configuration;
  running: boolean;
  trial: number;
  cameraReset: number;
  onComplete: (result: TrialResult) => void;
  onProgress: (seconds: number) => void;
};
export const DEFAULT_CONFIG: Configuration = {
  furniture: 'chair', pose: 'proper', lean: 0, offsetX: 0, offsetZ: 0, rotation: 0,
};
export const POSES: { id: Pose; name: string; subtitle: string; number: string }[] = [
  { id: 'proper', name: 'The civilian', subtitle: 'An almost suspicious respect for furniture.', number: '01' },
  { id: 'heir', name: 'The heir apparent', subtitle: 'The armrest is a seat. You own the company.', number: '02' },
  { id: 'sideways', name: 'The sideways negotiation', subtitle: 'Your legs have left the meeting.', number: '03' },
  { id: 'gargoyle', name: 'The boardroom gargoyle', subtitle: 'Perched above your responsibilities.', number: '04' },
];

const bounded = (value: string | null, fallback: number, min: number, max: number) => {
  if (value === null || value.trim() === '') return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
};

export function readConfiguration(search = window.location.search): Configuration {
  const params = new URLSearchParams(search);
  const furniture = params.get('f');
  const pose = params.get('p');
  return {
    furniture: furniture === 'couch' || furniture === 'pedestal' ? furniture : 'chair',
    pose: POSES.some(item => item.id === pose) ? pose as Pose : 'proper',
    lean: bounded(params.get('lean'), 0, -60, 60),
    offsetX: bounded(params.get('x'), 0, -1.8, 1.8),
    offsetZ: bounded(params.get('z'), 0, -1.5, 1.5),
    rotation: bounded(params.get('r'), 0, -180, 180),
  };
}

export function configurationUrl(config: Configuration): string {
  const url = new URL(window.location.href);
  url.search = new URLSearchParams({
    v: '1', f: config.furniture, p: config.pose, lean: String(config.lean),
    x: String(config.offsetX), z: String(config.offsetZ), r: String(config.rotation),
  }).toString();
  return url.toString();
}
