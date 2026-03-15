import { useState, lazy, Suspense } from 'react';
import { MONO, DISPLAY, colors, fonts } from './rendering/theme.js';

const TwinParadox = lazy(() => import('./experiences/twin-paradox/TwinParadox.jsx'));
const LightConeExplorer = lazy(() => import('./experiences/light-cone-explorer/LightConeExplorer.jsx'));
const LorentzBoost = lazy(() => import('./experiences/lorentz-boost/LorentzBoost.jsx'));
const ReferenceFrames = lazy(() => import('./experiences/reference-frames/ReferenceFrames.jsx'));

const experiences = [
  {
    id: 'twin-paradox',
    title: 'Twin Paradox',
    subtitle: 'Start here',
    description: 'Watch proper time diverge as one twin travels and returns. Scrub through time, toggle simultaneity lines.',
    color: colors.traveler,
    icon: '⟐',
    Component: TwinParadox,
  },
  {
    id: 'light-cones',
    title: 'Light Cone Explorer',
    subtitle: 'Interactive',
    description: 'Place and drag events on a spacetime diagram. Watch causal relationships flip as you move events across light cones.',
    color: colors.lightCone,
    icon: '◇',
    Component: LightConeExplorer,
  },
  {
    id: 'lorentz-boost',
    title: 'Lorentz Boost',
    subtitle: 'Transforms',
    description: 'See how spacetime coordinates shear under a Lorentz boost. The light cone stays fixed — that\'s the whole point.',
    color: colors.gridBoosted,
    icon: '⧫',
    Component: LorentzBoost,
  },
  {
    id: 'reference-frames',
    title: 'Reference Frames',
    subtitle: 'Side by side',
    description: 'The twin paradox shown simultaneously in two frames. See why it\'s not a paradox — the frames are not symmetric.',
    color: colors.home,
    icon: '⊞',
    Component: ReferenceFrames,
  },
];

function ExperienceCard({ exp, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: '1 1 250px',
        maxWidth: 300,
        background: hovered ? `${exp.color}08` : colors.panelBg,
        border: `1px solid ${hovered ? exp.color + '30' : colors.border}`,
        borderRadius: 8,
        padding: 20,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.6 }}>{exp.icon}</div>
      <div style={{
        fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.15em',
        color: exp.color, marginBottom: 6,
      }}>
        {exp.subtitle}
      </div>
      <div style={{
        fontFamily: DISPLAY, fontSize: 20, fontWeight: 400, color: '#fff',
        marginBottom: 8, fontStyle: 'italic',
      }}>
        {exp.title}
      </div>
      <div style={{ fontSize: 10.5, lineHeight: 1.6, color: colors.textDim }}>
        {exp.description}
      </div>
    </div>
  );
}

function Landing({ onSelect }) {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{
          fontFamily: DISPLAY, fontSize: 42, fontWeight: 400, color: '#fff',
          margin: 0, fontStyle: 'italic', lineHeight: 1.2,
        }}>
          Minkowski Spacetime Explorer
        </h1>
        <p style={{
          fontSize: 10, color: colors.textFaint, letterSpacing: '0.25em',
          textTransform: 'uppercase', marginTop: 8,
        }}>
          Special Relativity · Interactive Visualizations
        </p>
        <div style={{
          fontFamily: DISPLAY, fontSize: 16, color: colors.textDim,
          marginTop: 20, fontStyle: 'italic', maxWidth: 500, margin: '20px auto 0',
          lineHeight: 1.6,
        }}>
          dτ² = dt² − dx²
        </div>
      </div>

      <div style={{
        display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap',
      }}>
        {experiences.map(exp => (
          <ExperienceCard key={exp.id} exp={exp} onClick={() => onSelect(exp.id)} />
        ))}
      </div>

      <div style={{
        textAlign: 'center', marginTop: 48, fontSize: 10,
        color: colors.textGhost, lineHeight: 1.8,
      }}>
        Built for learning. All physics is exact (flat Minkowski spacetime, c = 1).
      </div>
    </div>
  );
}

function NavBar({ current, onSelect, onHome }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 16px', borderBottom: `1px solid ${colors.border}`,
      background: 'rgba(7,7,12,0.95)', position: 'sticky', top: 0, zIndex: 100,
    }}>
      <button
        onClick={onHome}
        style={{
          background: 'none', border: 'none', color: colors.textDim,
          fontFamily: DISPLAY, fontSize: 15, cursor: 'pointer', fontStyle: 'italic',
          padding: '4px 8px',
        }}
      >
        Minkowski Explorer
      </button>
      <span style={{ color: colors.textGhost }}>·</span>
      {experiences.map(exp => (
        <button
          key={exp.id}
          onClick={() => onSelect(exp.id)}
          style={{
            background: current === exp.id ? exp.color + '15' : 'none',
            border: current === exp.id ? `1px solid ${exp.color}30` : '1px solid transparent',
            borderRadius: 4,
            color: current === exp.id ? exp.color : colors.textDim,
            fontFamily: MONO, fontSize: 9, cursor: 'pointer',
            padding: '4px 10px', letterSpacing: '0.05em',
            transition: 'all 0.15s ease',
          }}
        >
          {exp.title}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [activeExp, setActiveExp] = useState(null);

  const ActiveComponent = activeExp
    ? experiences.find(e => e.id === activeExp)?.Component
    : null;

  return (
    <div style={{
      background: colors.bg,
      minHeight: '100vh',
      color: colors.text,
      fontFamily: MONO,
    }}>
      <link href={fonts.google} rel="stylesheet" />

      {activeExp ? (
        <>
          <NavBar current={activeExp} onSelect={setActiveExp} onHome={() => setActiveExp(null)} />
          <div style={{ padding: '16px 20px' }}>
            <Suspense fallback={
              <div style={{ textAlign: 'center', padding: 60, color: colors.textGhost }}>
                Loading...
              </div>
            }>
              {ActiveComponent && <ActiveComponent />}
            </Suspense>
          </div>
        </>
      ) : (
        <Landing onSelect={setActiveExp} />
      )}
    </div>
  );
}
