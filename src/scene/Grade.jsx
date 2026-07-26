import { EffectComposer, Bloom } from '@react-three/postprocessing';

// Cinematic grade: soft bloom so the orb's rim/halo and the stars glow like
// real light instead of flat sprites. mipmapBlur keeps it cheap; multisampling
// off keeps the composer light on the GPU (past crashes came from stacked GL
// passes). Mounted desktop-only from Scene — never in lite/reduced-motion.
export default function Grade() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        mipmapBlur
        intensity={0.95}
        luminanceThreshold={0.15}
        luminanceSmoothing={0.5}
        radius={0.72}
      />
    </EffectComposer>
  );
}
