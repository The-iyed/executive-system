import { useMemo } from "react";

/* ── Animated Neural Network SVG ── */
function NeuronSVG({ isActive, size = 320 }: { isActive: boolean; size?: number }) {
  // Generate neuron nodes in layers
  const nodes = useMemo(() => {
    const pts: { x: number; y: number; layer: number; id: number }[] = [];
    const cx = 160, cy = 160;
    // Center node
    pts.push({ x: cx, y: cy, layer: 0, id: 0 });
    // Inner ring
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 6;
      pts.push({ x: cx + Math.cos(angle) * 52, y: cy + Math.sin(angle) * 52, layer: 1, id: pts.length });
    }
    // Mid ring
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10 + Math.PI / 10;
      pts.push({ x: cx + Math.cos(angle) * 100, y: cy + Math.sin(angle) * 100, layer: 2, id: pts.length });
    }
    // Outer ring
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14;
      pts.push({ x: cx + Math.cos(angle) * 140, y: cy + Math.sin(angle) * 140, layer: 3, id: pts.length });
    }
    return pts;
  }, []);

  // Generate connections between adjacent layers
  const connections = useMemo(() => {
    const conns: { from: number; to: number; key: string }[] = [];
    const byLayer: Record<number, typeof nodes> = {};
    nodes.forEach(n => { (byLayer[n.layer] ??= []).push(n); });

    // Center to inner
    byLayer[1]?.forEach(n => conns.push({ from: 0, to: n.id, key: `0-${n.id}` }));
    // Inner to mid
    byLayer[1]?.forEach(a => {
      byLayer[2]?.forEach(b => {
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 80) conns.push({ from: a.id, to: b.id, key: `${a.id}-${b.id}` });
      });
    });
    // Mid to outer
    byLayer[2]?.forEach(a => {
      byLayer[3]?.forEach(b => {
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 70) conns.push({ from: a.id, to: b.id, key: `${a.id}-${b.id}` });
      });
    });
    return conns;
  }, [nodes]);

  return (
    <svg
      viewBox="0 0 320 320"
      width={size}
      height={size}
      className="neuron-svg"
    >
      <defs>
        <radialGradient id="neuron-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="oklch(0.64 0.12 160)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="oklch(0.64 0.12 160)" stopOpacity="0" />
        </radialGradient>
        <filter id="neuron-blur">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>

      {/* Background glow */}
      <circle cx="160" cy="160" r="150" fill="url(#neuron-glow)" />

      {/* Connections */}
      {connections.map((c, i) => {
        const from = nodes[c.from];
        const to = nodes[c.to];
        return (
          <line
            key={c.key}
            x1={from.x} y1={from.y}
            x2={to.x} y2={to.y}
            className="neuron-connection"
            style={{
              animationDelay: `${(i * 0.15) % 4}s`,
              animationDuration: isActive ? "1.5s" : "4s",
            }}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((n) => {
        const r = n.layer === 0 ? 6 : n.layer === 1 ? 4.5 : n.layer === 2 ? 3.5 : 2.5;
        return (
          <g key={n.id}>
            {/* Glow behind node */}
            <circle
              cx={n.x} cy={n.y} r={r * 2.5}
              className="neuron-node-glow"
              style={{
                animationDelay: `${(n.id * 0.2) % 3}s`,
                animationDuration: isActive ? "1.2s" : "3s",
              }}
            />
            {/* Node */}
            <circle
              cx={n.x} cy={n.y} r={r}
              className="neuron-node"
              style={{
                animationDelay: `${(n.id * 0.3) % 2.5}s`,
                animationDuration: isActive ? "1s" : "2.5s",
              }}
            />
          </g>
        );
      })}

      {/* Pulse signals traveling along connections when active */}
      {isActive && connections.filter((_, i) => i % 3 === 0).map((c, i) => {
        const from = nodes[c.from];
        const to = nodes[c.to];
        return (
          <circle key={`pulse-${c.key}`} r="2" className="neuron-pulse">
            <animateMotion
              dur={`${1.2 + (i % 3) * 0.4}s`}
              repeatCount="indefinite"
              path={`M${from.x},${from.y} L${to.x},${to.y}`}
              begin={`${(i * 0.3) % 2}s`}
            />
          </circle>
        );
      })}
    </svg>
  );
}

export { NeuronSVG };
