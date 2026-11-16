import {useEffect, useRef, useState} from 'react';

/**
 * Integrates strobe phase from the measured cents offset. The phase is not a
 * decorative loop: its speed and direction are determined by live pitch.
 */
export function useStrobePhase(
  cents: number,
  locked: boolean,
  enabled: boolean,
  speed = 0.055,
): number {
  const [phase, setPhase] = useState(0);
  const phaseRef = useRef(0);
  const centsRef = useRef(cents);
  const lockedRef = useRef(locked);
  const enabledRef = useRef(enabled);

  centsRef.current = cents;
  lockedRef.current = locked;
  enabledRef.current = enabled;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let animationFrame = 0;
    let previous = 0;
    let lastPublished = 0;
    const step = (time: number) => {
      if (!previous) {
        previous = time;
      }
      const delta = Math.min(0.08, (time - previous) / 1000);
      previous = time;
      if (enabledRef.current && !lockedRef.current && Number.isFinite(centsRef.current)) {
        const movement = centsRef.current * speed * delta;
        phaseRef.current = (((phaseRef.current + movement) % 1) + 1) % 1;
      }
      if (time - lastPublished > 32) {
        lastPublished = time;
        setPhase(phaseRef.current);
      }
      animationFrame = requestAnimationFrame(step);
    };
    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [enabled, speed]);

  return phase;
}
