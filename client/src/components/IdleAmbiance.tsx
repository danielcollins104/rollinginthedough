/**
 * IdleAmbiance — keeps the cabinet feeling alive when nothing is happening.
 *
 * Renders three absolutely-positioned, pointer-events-none layers behind the
 * cabinet content:
 *   1. A slowly rotating gold coin on the cabinet side
 *   2. A second slow-rotating coin on the opposite side
 *   3. A soft animated ocean-light gradient that drifts over the cabinet
 *      backdrop (CSS animation).
 */
export function IdleAmbiance() {
  const coinStyle = (offsetX: number, reverse = false): React.CSSProperties => ({
    position: "absolute",
    left: `calc(50% + ${offsetX}px)`,
    top: "78%",
    width: 160,
    height: 160,
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    opacity: 0.12,
    filter: "blur(2px)",
    animation: reverse
      ? "cabinetCoinOrbit 18s linear infinite reverse"
      : "cabinetCoinOrbit 18s linear infinite",
    zIndex: 0,
  });
  return (
    <>
      <img
        src="/pg/goldbars.png"
        alt=""
        aria-hidden
        draggable={false}
        style={{ ...coinStyle(-360), borderRadius: "50%" }}
      />
      <img
        src="/pg/wild.png"
        alt=""
        aria-hidden
        draggable={false}
        style={{ ...coinStyle(360, true), borderRadius: "50%" }}
      />
    </>
  );
}