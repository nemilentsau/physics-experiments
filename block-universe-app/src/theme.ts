export const MONO = `'JetBrains Mono', 'IBM Plex Mono', monospace`;
export const DISPLAY = `'Cormorant Garamond', 'Playfair Display', serif`;

export const colors = {
  bg: '#07070c',
  sliceGold: '#e6b84f',
  sliceAmber: '#d4854a',
  eventCyan: '#8dd8e0',
  eventWhite: '#f0f0f0',
  lightCone: '#ffc832',
  timelike: '#4a9eff',
  spacelike: '#ff8a4a',
  lightlike: '#ffc832',
  text: '#d8d8d8',
  textDim: 'rgba(255,255,255,0.4)',
  textFaint: 'rgba(255,255,255,0.25)',
  textGhost: 'rgba(255,255,255,0.15)',
  border: 'rgba(255,255,255,0.06)',
  panelBg: 'rgba(255,255,255,0.02)',
  grid: 'rgba(255,255,255,0.025)',
  axis: 'rgba(255,255,255,0.15)',
  observerA: '#4a9eff',
  observerB: '#ff6b4a',
  observerC: '#00e5cc',
  observerD: '#c77dff',
  worldline: '#8dd8e0',
  worldtube: 'rgba(141,216,224,0.12)',
  blockFill: 'rgba(230,184,79,0.06)',
} as const;

export const fonts = {
  google: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@300;400;500;600&display=swap',
} as const;
