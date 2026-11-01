import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import {
  Physics, RigidBody, CuboidCollider, BallCollider, CapsuleCollider,
  useAfterPhysicsStep, type RapierRigidBody, type CollisionEnterPayload, type CollisionExitPayload,
} from '@react-three/rapier';
import { Euler, Quaternion, Vector3 } from 'three';
import type { ComponentRef } from 'react';
import type { Configuration, SceneProps } from './model';

type V3 = [number, number, number];
type Piece = { position: V3; size: V3; color: string };
type Limb = { position: V3; rotation: V3; half: number; radius: number };
const RUST = '#c3623e';
const DARK = '#263d35';
const TAUPE = '#9a9481';
const STEP = 1 / 60;

function furniturePieces(kind: Configuration['furniture']): Piece[] {
  if (kind === 'pedestal') return [
    { position: [0, .51, 0], size: [1.12, 1.02, 1.12], color: TAUPE },
    { position: [0, 1.06, 0], size: [1.4, .08, 1.4], color: DARK },
  ];
  const width = kind === 'couch' ? 2.8 : 1.4;
  const pieces: Piece[] = [
    { position: [0, .98, 0], size: [width, .24, 1.3], color: DARK },
    { position: [0, 1.64, -.73], size: [width, 1.34, .18], color: DARK },
  ];
  for (const side of [-1, 1]) {
    pieces.push({ position: [side * (width / 2 + .04), 1.43, -.03], size: [.13, .13, 1.3], color: TAUPE });
    for (const z of [-.48, .48]) {
      pieces.push({ position: [side * (width / 2 - .12), .43, z], size: [.12, .86, .12], color: DARK });
    }
  }
  return pieces;
}

function segment(a: V3, b: V3, radius: number): Limb {
  const start = new Vector3(...a);
  const end = new Vector3(...b);
  const direction = end.clone().sub(start);
  const rotation = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize()));
  return { position: start.add(end).multiplyScalar(.5).toArray() as V3,
    rotation: [rotation.x, rotation.y, rotation.z], half: direction.length() / 2, radius };
}

function poseShape(pose: Configuration['pose']) {
  const limbs: Limb[] = [];
  const crouch = pose === 'gargoyle';
  for (const side of [-1, 1]) {
    const x = side * .19;
    const knee: V3 = [x, crouch ? .2 : -.13, crouch ? .48 : .84];
    const ankle: V3 = [x, crouch ? -.17 : -1.13, crouch ? .53 : .89];
    limbs.push(segment([x, -.06, .03], knee, .115));
    limbs.push(segment(knee, ankle, .085));
    limbs.push(segment(ankle, [x, ankle[1] - .02, ankle[2] + .23], .09));
    const elbow: V3 = [side * .44, pose === 'heir' ? .38 : .18, pose === 'heir' ? -.2 : .13];
    limbs.push(segment([side * .32, .65, -.025], elbow, .08));
    limbs.push(segment(elbow, [side * .34, .02, .38], .072));
  }
  return limbs;
}

function initialTransform(config: Configuration, pieces: Piece[], limbs: Limb[]) {
  const rotation: V3 = [config.lean * Math.PI / 180, (config.rotation + (config.pose === 'sideways' ? 90 : 0)) * Math.PI / 180, 0];
  const quaternion = new Quaternion().setFromEuler(new Euler(...rotation));
  const position: V3 = [config.offsetX + (config.pose === 'heir' ? .48 : 0), 1.4, config.offsetZ];
  // Conservative bounds keep the held preview above any furniture it overlaps.
  // This also prevents a deeply leaned limb being released inside a seat/back.
  const bounds = [
    { center: [0, 0, 0] as V3, half: [.28, .24, .24] as V3 },
    { center: [0, .47, -.035] as V3, half: [.235, .365, .235] as V3 },
    { center: [0, 1.04, -.025] as V3, half: [.205, .205, .205] as V3 },
    ...limbs.map(limb => {
      const q = new Quaternion().setFromEuler(new Euler(...limb.rotation));
      const axis = new Vector3(0, limb.half, 0).applyQuaternion(q);
      return { center: limb.position, half: [Math.abs(axis.x) + limb.radius, Math.abs(axis.y) + limb.radius, Math.abs(axis.z) + limb.radius] as V3 };
    }),
  ].map(({ center, half }) => {
    const points: Vector3[] = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
      points.push(new Vector3(center[0] + x * half[0], center[1] + y * half[1], center[2] + z * half[2]).applyQuaternion(quaternion));
    }
    return { min: new Vector3(...[0, 1, 2].map(i => Math.min(...points.map(p => p.getComponent(i))))),
      max: new Vector3(...[0, 1, 2].map(i => Math.max(...points.map(p => p.getComponent(i))))) };
  });
  for (let pass = 0; pass < 12; pass++) {
    let lift = 0;
    for (const bound of bounds) {
      lift = Math.max(lift, .015 - (position[1] + bound.min.y));
      for (const piece of pieces) {
        const [x, y, z] = piece.position;
        const [w, h, d] = piece.size;
        if (position[0] + bound.max.x > x - w / 2 && position[0] + bound.min.x < x + w / 2 &&
            position[2] + bound.max.z > z - d / 2 && position[2] + bound.min.z < z + d / 2 &&
            position[1] + bound.max.y > y - h / 2 && position[1] + bound.min.y < y + h / 2) {
          lift = Math.max(lift, y + h / 2 + .012 - position[1] - bound.min.y);
        }
      }
    }
    if (lift <= 0) break;
    position[1] += lift;
  }
  return { position, rotation };
}

function Furniture({ pieces }: { pieces: Piece[] }) {
  return <RigidBody type="fixed" colliders={false} name="furniture" friction={1.2}>
    {pieces.map((piece, index) => <group key={index} position={piece.position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={piece.size} />
        <meshStandardMaterial color={piece.color} roughness={.78} />
      </mesh>
      <CuboidCollider args={[piece.size[0] / 2, piece.size[1] / 2, piece.size[2] / 2]} />
    </group>)}
  </RigidBody>;
}

function Experiment({ config, running, onComplete, onProgress }: SceneProps) {
  const body = useRef<RapierRigidBody>(null);
  const [finished, setFinished] = useState(false);
  const done = useRef(false);
  const elapsed = useRef(0);
  const lastProgress = useRef(0);
  const contactDuration = useRef(0);
  const everSupported = useRef(false);
  const contacts = useRef(new Set<string>());
  const callbacks = useRef({ onComplete, onProgress });
  callbacks.current = { onComplete, onProgress };
  const pieces = useMemo(() => furniturePieces(config.furniture), [config.furniture]);
  const limbs = useMemo(() => poseShape(config.pose), [config.pose]);
  const initial = useMemo(() => initialTransform(config, pieces, limbs), [config, pieces, limbs]);

  useEffect(() => {
    if (running || done.current || !body.current) return;
    body.current.setTranslation(new Vector3(...initial.position), false);
    body.current.setRotation(new Quaternion().setFromEuler(new Euler(...initial.rotation)), false);
    body.current.setLinvel({ x: 0, y: 0, z: 0 }, false);
    body.current.setAngvel({ x: 0, y: 0, z: 0 }, false);
    body.current.resetForces(false);
    body.current.resetTorques(false);
    contacts.current.clear();
    elapsed.current = 0;
    lastProgress.current = 0;
    contactDuration.current = 0;
    everSupported.current = false;
    callbacks.current.onProgress(0);
  }, [running, initial]);

  const collision = (event: CollisionEnterPayload | CollisionExitPayload, entering: boolean) => {
    if (event.other.rigidBodyObject?.name !== 'furniture') return;
    const key = `${event.target.collider.handle}:${event.other.collider.handle}`;
    if (entering) contacts.current.add(key);
    else contacts.current.delete(key);
  };

  useAfterPhysicsStep(() => {
    if (!running || done.current || !body.current) return;
    elapsed.current = Math.min(6, elapsed.current + STEP);
    const pelvis = body.current.translation();
    const rotation = body.current.rotation();
    const upright = new Vector3(0, 1, 0).applyQuaternion(new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)).y;
    const furnitureContact = contacts.current.size > 0 && pelvis.y > .92;
    contactDuration.current = furnitureContact ? contactDuration.current + STEP : 0;
    if (contactDuration.current > .3) everSupported.current = true;
    if (elapsed.current - lastProgress.current >= .099) {
      lastProgress.current = elapsed.current;
      callbacks.current.onProgress(elapsed.current);
    }
    const fell = elapsed.current > .35 && (pelvis.y < .72 || (upright < .15 && pelvis.y < 1.02));
    if (fell || elapsed.current >= 6 - 1e-8) {
      done.current = true;
      setFinished(true);
      const velocity = body.current.linvel();
      const angular = body.current.angvel();
      const settled = Math.hypot(velocity.x, velocity.y, velocity.z) < .35 && Math.hypot(angular.x, angular.y, angular.z) < .6;
      const supported = contactDuration.current >= .5 && upright > .35 && settled;
      callbacks.current.onProgress(elapsed.current);
      callbacks.current.onComplete({
        status: fell ? 'fallen' : supported ? 'supported' : everSupported.current && pelvis.y < .92 ? 'fallen' : 'unsupported',
        seconds: elapsed.current,
      });
    }
  });

  return <>
    <Furniture pieces={pieces} />
    <RigidBody type="fixed" colliders={false} friction={1}>
      <CuboidCollider position={[0, -.12, 0]} args={[100, .12, 100]} />
    </RigidBody>
    <RigidBody ref={body} type={running || finished ? 'dynamic' : 'fixed'} colliders={false}
      position={initial.position} rotation={initial.rotation} friction={1.1} restitution={0}
      linearDamping={.15} angularDamping={.3} canSleep ccd
      onCollisionEnter={event => collision(event, true)} onCollisionExit={event => collision(event, false)}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[.56, .48, .48]} />
        <meshStandardMaterial color={RUST} roughness={.62} />
      </mesh>
      <CuboidCollider args={[.28, .24, .24]} density={4} />
      <mesh position={[0, .47, -.035]} castShadow>
        <capsuleGeometry args={[.235, .26, 8, 16]} />
        <meshStandardMaterial color={RUST} roughness={.62} />
      </mesh>
      <CapsuleCollider position={[0, .47, -.035]} args={[.13, .235]} density={1.5} />
      <mesh position={[0, 1.04, -.025]} castShadow>
        <sphereGeometry args={[.205, 24, 20]} />
        <meshStandardMaterial color="#d77d51" roughness={.65} />
      </mesh>
      <BallCollider position={[0, 1.04, -.025]} args={[.205]} density={.8} />
      <mesh position={[0, 1.065, .172]}>
        <boxGeometry args={[.17, .018, .025]} />
        <meshStandardMaterial color="#653b2b" />
      </mesh>
      {limbs.map((limb, index) => <group key={index} position={limb.position} rotation={limb.rotation}>
        <mesh castShadow>
          <capsuleGeometry args={[limb.radius, limb.half * 2, 6, 12]} />
          <meshStandardMaterial color={index % 5 === 2 ? '#9f492f' : RUST} roughness={.7} />
        </mesh>
        <CapsuleCollider args={[limb.half, limb.radius]} density={.7} />
      </group>)}
    </RigidBody>
  </>;
}

function Camera({ reset }: { reset: number }) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(4.8, 3.6, 6.2);
    camera.lookAt(0, 1.1, 0);
    controls.current?.target.set(0, 1.1, 0);
    controls.current?.update();
  }, [reset, camera]);
  return <OrbitControls ref={controls} makeDefault target={[0, 1.1, 0]} minDistance={3.2} maxDistance={12}
    maxPolarAngle={Math.PI / 2 - .025} enableDamping dampingFactor={.08} />;
}

function World(props: SceneProps) {
  const [finished, setFinished] = useState(false);
  return <Physics gravity={[0, -9.81, 0]} timeStep={STEP} paused={!props.running || finished} colliders={false}>
    <Experiment {...props} onComplete={result => { setFinished(true); props.onComplete(result); }} />
  </Physics>;
}

export default function Scene(props: SceneProps) {
  const resetKey = JSON.stringify([props.config, props.trial]);
  return <Canvas shadows dpr={[1, 1.75]} camera={{ position: [4.8, 3.6, 6.2], fov: 39, near: .1, far: 80 }}
    style={{ width: '100%', height: '100%', display: 'block', background: '#edeae1' }}
    gl={{ antialias: true, alpha: true }}>
    <color attach="background" args={['#edeae1']} />
    <fog attach="fog" args={['#edeae1', 15, 35]} />
    <ambientLight intensity={1.15} />
    <hemisphereLight args={['#fff9ed', '#a9a28c', 1.4]} />
    <directionalLight position={[3, 7, 4]} intensity={3} castShadow shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6}
      shadow-normalBias={.025} />
    <directionalLight position={[-4, 4, -3]} intensity={1.3} color="#ffdec0" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.006, 0]} receiveShadow>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial color="#edeae1" roughness={1} />
    </mesh>
    <gridHelper args={[20, 40, '#c3bcaa', '#d9d3c4']} position={[0, .001, 0]} />
    <Suspense fallback={null}>
      <World key={resetKey} {...props} />
      <ContactShadows position={[0, .008, 0]} opacity={.3} scale={14} blur={2.5} far={4} resolution={256} color="#574c36" />
    </Suspense>
    <Camera reset={props.cameraReset} />
  </Canvas>;
}
