// Twin paradox worldline physics — extracted from twin-paradox-v2.jsx

// Get traveler state at any coordinate time
export function getTravelerState(t, v, tOutbound, accelDuration, L) {
  const tA1 = tOutbound - accelDuration;
  const tA2 = tOutbound + accelDuration;
  const totalAccelTime = 2 * accelDuration;

  let x, localV, phase;

  if (t <= 0) {
    return { x: 0, v: v, phase: "pre" };
  } else if (t <= tA1) {
    x = v * t;
    localV = v;
    phase = "outbound";
  } else if (t <= tA2) {
    const lt = t - tA1;
    const p = (lt / totalAccelTime) * Math.PI;
    localV = v * Math.cos(p);
    const xStart = v * tA1;
    x = xStart + (v * totalAccelTime / Math.PI) * Math.sin(p);
    phase = "turnaround";
  } else {
    const realPeak = v * tA1 + (2 * v * accelDuration / Math.PI);
    x = realPeak - v * (t - tA2);
    localV = -v;
    phase = "return";
  }

  return { x, v: localV, phase };
}

// Numerically integrate proper time along the traveler's worldline
export function integrateProperTime(tEnd, v, tOutbound, accelDuration) {
  if (tEnd <= 0) return 0;
  const steps = 500;
  const dt = tEnd / steps;
  let tau = 0;
  for (let i = 0; i < steps; i++) {
    const t = (i + 0.5) * dt;
    const state = getTravelerState(t, v, tOutbound, accelDuration, 0);
    const speed = Math.abs(state.v);
    tau += Math.sqrt(1 - speed * speed) * dt;
  }
  return tau;
}

// Generate worldline points for rendering
export function buildWorldlinePoints(v, tOutbound, accelDuration, tTotal, numPoints = 400) {
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * tTotal;
    const state = getTravelerState(t, v, tOutbound, accelDuration, 0);
    points.push({ t, x: state.x, v: state.v, phase: state.phase });
  }
  return points;
}

// Collect timeline data for charts
export function buildTimelineData(v, tOutbound, accelDuration, tTotal, numPoints = 200) {
  const data = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * tTotal;
    const state = getTravelerState(t, v, tOutbound, accelDuration, 0);
    const speed = Math.abs(state.v);
    const rate = Math.sqrt(1 - speed * speed);
    const tauTrav = integrateProperTime(t, v, tOutbound, accelDuration);
    data.push({ t, rate, tauHome: t, tauTrav, speed, phase: state.phase });
  }
  return data;
}

// Binary search for coordinate time giving a specific proper time
export function coordinateTimeForProperTime(targetTau, v, tOutbound, accelDuration, tTotal) {
  let lo = 0, hi = tTotal;
  for (let iter = 0; iter < 40; iter++) {
    const mid = (lo + hi) / 2;
    if (integrateProperTime(mid, v, tOutbound, accelDuration) < targetTau) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
