export type OrbState = 'idle' | 'listening' | 'thinking' | 'talking';

/**
 * The chat "AI Core" hero: a layered, animated orb that reflects the
 * assistant's current state. Pure presentation — all motion is CSS-driven
 * (see the c-core-* block in customer.css); this component holds no timers.
 */
export function AiCoreOrb({ state, letter }: { state: OrbState; letter: string }) {
  return (
    <div className={`c-core state-${state}`} data-testid="ai-core">
      <div className="c-core-glow" />
      <div className="c-core-ping" />
      <div className="c-core-ring r1" />
      <div className="c-core-ring r2" />
      <div className="c-core-rotor" />
      <div className="c-core-disc">
        <span className="c-core-letter">{letter}</span>
      </div>
      <div className="c-core-rimlight" />
      <div className="c-core-wave" aria-hidden="true">
        <span /><span /><span /><span /><span />
      </div>
    </div>
  );
}
