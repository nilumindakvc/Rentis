import { useEffect, useRef, useState } from "react";

// Three tiles, each stepping through the icon set in order — no spinning,
// just a direct swap. Left tile changes first, then middle, then right,
// then the whole row holds before the next round starts.
const STEP_INTERVAL_MS = 900;
const HOLD_MS = 30000;

export default function HeroIconReels({ icons }) {
  const [tileIndexes, setTileIndexes] = useState(() => [
    0 % icons.length,
    1 % icons.length,
    2 % icons.length,
  ]);
  const timersRef = useRef([]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      return undefined;
    }

    let cancelled = false;

    const clearTimers = () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };

    const advanceTile = (tile) => {
      if (cancelled) return;
      setTileIndexes((prev) => {
        const next = [...prev];
        next[tile] = (next[tile] + 1) % icons.length;
        return next;
      });
    };

    const runRound = () => {
      if (cancelled) return;

      [0, 1, 2].forEach((tile) => {
        const id = window.setTimeout(() => advanceTile(tile), tile * STEP_INTERVAL_MS);
        timersRef.current.push(id);
      });

      const restartId = window.setTimeout(() => {
        clearTimers();
        runRound();
      }, 2 * STEP_INTERVAL_MS + HOLD_MS);
      timersRef.current.push(restartId);
    };

    // Hold the initial combination for a full pause before the first round,
    // so the hold is visible from the moment the page loads.
    const firstRunId = window.setTimeout(runRound, HOLD_MS);
    timersRef.current.push(firstRunId);

    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [icons.length]);

  return (
    <div className="home-hero__icon-badge" aria-hidden="true">
      {tileIndexes.map((iconIndex, tile) => (
        <div className="home-hero__icon-tile" key={tile}>
          <div className="home-hero__icon-tile-inner" key={icons[iconIndex].key}>
            {icons[iconIndex].node}
          </div>
        </div>
      ))}
    </div>
  );
}
