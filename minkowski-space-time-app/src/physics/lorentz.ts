// Pure Lorentz transform math — no React

export const gamma = (v) => 1 / Math.sqrt(1 - v * v);
export const dtaudt = (v) => Math.sqrt(1 - v * v);

// Lorentz boost matrix: transforms (t, x) → (t', x') for observer moving at velocity v
// Convention: positive v = boost in +x direction
export function boostEvent(t, x, v) {
  const g = gamma(v);
  return {
    t: g * (t - v * x),
    x: g * (x - v * t),
  };
}

// Inverse boost
export function inverseBoostEvent(tPrime, xPrime, v) {
  return boostEvent(tPrime, xPrime, -v);
}

// Relativistic velocity addition: u' in frame moving at v relative to lab
export function velocityAddition(u, v) {
  return (u + v) / (1 + u * v);
}

// Spacetime interval squared: negative = timelike, positive = spacelike, zero = lightlike
export function intervalSquared(dt, dx) {
  return dx * dx - dt * dt;
}

// Classify the causal relationship between two events
export function causalRelation(dt, dx) {
  const s2 = intervalSquared(dt, dx);
  const eps = 1e-10;
  if (s2 < -eps) return "timelike";
  if (s2 > eps) return "spacelike";
  return "lightlike";
}

// Relativistic Doppler factor: f_obs / f_src for source approaching at velocity v
export function dopplerFactor(v) {
  return Math.sqrt((1 + v) / (1 - v));
}
