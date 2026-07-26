import { EffectComposer, Bloom, DepthOfField } from '@react-three/postprocessing';

// Cinematic grade. On the pale build the lens does the work rather than the
// glow: depth of field throws the star field and the far side of the orb out
// of focus, which is most of what reads as an expensive render. Bloom stays
// but only catches true speculars now — on a light ground a low threshold
// bloomed everything and turned the frame to milk.
// multisampling off keeps the composer light on the GPU (past crashes came
// from stacked GL passes). Mounted desktop-only from Scene.
export default function Grade() {
  return (
    <EffectComposer multisampling={0}>
      <DepthOfField target={[0, 0.6, 0]} focalLength={0.012} bokehScale={3.2} height={480} />
      <Bloom
        mipmapBlur
        intensity={0.3}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.35}
        radius={0.68}
      />
    </EffectComposer>
  );
}
