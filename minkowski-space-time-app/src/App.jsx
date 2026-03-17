import { useState, lazy, Suspense, useCallback, useEffect, useRef } from 'react';
import { MONO, DISPLAY, colors, fonts } from './rendering/theme.js';
import { useViewport } from './hooks/useViewport.js';
import {
  DEFAULT_JOURNEY_STATE,
  buildUrlFromAppState,
  parseAppStateFromSearch,
} from './state/shareableState.js';

const TwinParadox = lazy(() => import('./experiences/twin-paradox/TwinParadox.jsx'));
const LightConeExplorer = lazy(() => import('./experiences/light-cone-explorer/LightConeExplorer.jsx'));
const LorentzBoost = lazy(() => import('./experiences/lorentz-boost/LorentzBoost.jsx'));
const ReferenceFrames = lazy(() => import('./experiences/reference-frames/ReferenceFrames.jsx'));

const experiences = [
  {
    id: 'twin-paradox',
    chapter: 'Chapter 1',
    title: 'Twin Paradox',
    subtitle: 'The Hook',
    description: 'Watch proper time diverge as one twin travels and returns. Scrub through time and see the age gap accumulate continuously.',
    goal: 'Understand why the traveling twin ages less.',
    takeaway: 'Proper time depends on path through spacetime.',
    color: colors.traveler,
    icon: '⟐',
    Component: TwinParadox,
  },
  {
    id: 'lorentz-boost',
    chapter: 'Chapter 2',
    title: 'Lorentz Boost',
    subtitle: 'The Mechanism',
    description: 'See how spacetime coordinates shear under a Lorentz boost while the light cone stays fixed.',
    goal: 'See that changing frames tilts axes, not physics.',
    takeaway: 'Time dilation and length contraction come from one geometric transform.',
    color: colors.gridBoosted,
    icon: '⧫',
    Component: LorentzBoost,
  },
  {
    id: 'reference-frames',
    chapter: 'Chapter 3',
    title: 'Reference Frames',
    subtitle: 'The Resolution',
    description: 'Show the same twin-paradox events in two frames and watch the symmetry break at turnaround.',
    goal: 'Compare the same events in two coordinate systems.',
    takeaway: 'The paradox disappears when you track frame changes carefully.',
    color: colors.home,
    icon: '⊞',
    Component: ReferenceFrames,
  },
  {
    id: 'light-cones',
    chapter: 'Chapter 4',
    title: 'Light Cone Lab',
    subtitle: 'The Sandbox',
    description: 'Place and drag events on a spacetime diagram. Watch causal relationships flip as you move events across light cones.',
    goal: 'Build intuition for what can and cannot be causally connected.',
    takeaway: 'The light cone is the boundary of possible influence.',
    color: colors.lightCone,
    icon: '◇',
    Component: LightConeExplorer,
  },
];

function ExperienceCard({ exp, onClick, compact }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: '1 1 280px',
        minHeight: compact ? 210 : 230,
        background: hovered
          ? `linear-gradient(180deg, ${exp.color}14, rgba(255,255,255,0.02))`
          : 'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))',
        border: `1px solid ${hovered ? exp.color + '40' : colors.border}`,
        borderRadius: 18,
        padding: compact ? 18 : 22,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? `0 18px 42px ${exp.color}12` : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle at top right, ${exp.color}10, transparent 45%)`,
        pointerEvents: 'none',
      }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: compact ? 14 : 18,
        }}>
          <div style={{ fontSize: compact ? 24 : 30, opacity: 0.72 }}>{exp.icon}</div>
          <div style={{
            fontSize: 8,
            color: colors.textGhost,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
            {exp.chapter}
          </div>
        </div>
      </div>
      <div style={{
        position: 'relative',
        zIndex: 1,
        fontSize: 8,
        textTransform: 'uppercase',
        letterSpacing: '0.18em',
        color: exp.color,
        marginBottom: 8,
      }}>
        {exp.subtitle}
      </div>
      <div style={{
        position: 'relative',
        zIndex: 1,
        fontFamily: DISPLAY,
        fontSize: compact ? 22 : 26,
        fontWeight: 400,
        color: '#fff',
        marginBottom: 10,
        fontStyle: 'italic',
        lineHeight: 1.1,
      }}>
        {exp.title}
      </div>
      <div style={{
        position: 'relative',
        zIndex: 1,
        fontSize: 10.5,
        lineHeight: 1.7,
        color: colors.textDim,
        marginBottom: 16,
      }}>
        {exp.description}
      </div>
      <div style={{
        position: 'relative',
        zIndex: 1,
        marginTop: 'auto',
        paddingTop: 14,
        borderTop: `1px solid ${hovered ? exp.color + '30' : 'rgba(255,255,255,0.05)'}`,
      }}>
        <div style={{
          fontSize: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          color: colors.textGhost,
          marginBottom: 6,
        }}>
          Goal
        </div>
        <div style={{ fontSize: 10, lineHeight: 1.7, color: '#f2eee8' }}>
          {exp.goal}
        </div>
      </div>
    </div>
  );
}

function Landing({ onSelect, isCompact, isMobile }) {
  const starter = experiences[0];
  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: isMobile ? '20px 14px 36px' : '36px 20px 54px' }}>
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${colors.border}`,
        borderRadius: isMobile ? 20 : 28,
        background: `
          radial-gradient(circle at top left, rgba(255,107,74,0.16), transparent 28%),
          radial-gradient(circle at 80% 20%, rgba(0,229,204,0.12), transparent 24%),
          linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))
        `,
        padding: isMobile ? '22px 18px 20px' : '36px 28px 30px',
        marginBottom: 26,
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '120px 120px',
          maskImage: 'radial-gradient(circle at center, black, transparent 85%)',
          pointerEvents: 'none',
        }}
        />
        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          gap: isMobile ? 16 : 24,
          justifyContent: 'space-between',
          alignItems: 'stretch',
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: '1 1 560px', minWidth: 0 }}>
            <div style={{
              fontSize: isMobile ? 8 : 9,
              color: colors.lightCone,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              marginBottom: isMobile ? 8 : 12,
            }}>
              A guided visual story about flat spacetime
            </div>
            <h1 style={{
              fontFamily: DISPLAY,
              fontSize: isMobile ? 'clamp(34px, 12vw, 46px)' : 'clamp(42px, 7vw, 74px)',
              fontWeight: 400,
              color: '#fff',
              margin: 0,
              fontStyle: 'italic',
              lineHeight: 0.98,
              maxWidth: 760,
            }}>
              Minkowski Spacetime Explorer
            </h1>
            <div style={{
              marginTop: isMobile ? 14 : 18,
              maxWidth: 640,
              fontSize: isMobile ? 12 : 14,
              lineHeight: 1.75,
              color: 'rgba(255,255,255,0.66)',
            }}>
              Start with the paradox, then watch the geometry explain it. Each chapter sharpens one idea:
              path length in spacetime, tilted coordinates, broken symmetry, and the boundary of causality.
            </div>
            <div style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              marginTop: isMobile ? 18 : 24,
              alignItems: 'center',
            }}>
              <button
                onClick={() => onSelect(starter.id)}
                style={{
                  padding: isMobile ? '11px 14px' : '12px 18px',
                  borderRadius: 999,
                  border: `1px solid ${starter.color}55`,
                  background: `linear-gradient(90deg, ${starter.color}22, rgba(255,255,255,0.04))`,
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: MONO,
                  fontSize: isMobile ? 9 : 10,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                Start Guided Tour
              </button>
              <div style={{
                fontFamily: DISPLAY,
                fontSize: isMobile ? 16 : 18,
                color: 'rgba(255,255,255,0.52)',
                fontStyle: 'italic',
              }}>
                dτ² = dt² − dx²
              </div>
            </div>
          </div>

          <div style={{
            flex: '0 1 320px',
            minWidth: isMobile ? 0 : 260,
            border: `1px solid rgba(255,255,255,0.08)`,
            borderRadius: isMobile ? 16 : 20,
            background: 'rgba(7,7,12,0.44)',
            padding: isMobile ? 16 : 20,
            backdropFilter: 'blur(6px)',
          }}>
            <div style={{
              fontSize: 8,
              color: colors.textGhost,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: isMobile ? 10 : 14,
            }}>
              Recommended path
            </div>
            {experiences.map((exp, index) => (
              <div key={exp.id} style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                padding: index === experiences.length - 1 ? '0' : `0 0 ${isMobile ? 10 : 14}px`,
                marginBottom: index === experiences.length - 1 ? 0 : (isMobile ? 10 : 14),
                borderBottom: index === experiences.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{
                  width: isMobile ? 22 : 26,
                  height: isMobile ? 22 : 26,
                  borderRadius: '50%',
                  border: `1px solid ${exp.color}45`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: exp.color,
                  fontSize: isMobile ? 10 : 11,
                  flexShrink: 0,
                }}>
                  {index + 1}
                </div>
                <div>
                  <div style={{ fontSize: isMobile ? 10 : 11, color: '#fff', marginBottom: 3 }}>
                    {exp.title}
                  </div>
                  <div style={{ fontSize: isMobile ? 9 : 9.5, color: colors.textDim, lineHeight: 1.6 }}>
                    {exp.goal}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: isMobile ? 12 : 16,
        flexWrap: 'wrap',
      }}>
        <div>
          <div style={{
            fontSize: 8,
            color: colors.textGhost,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            Chapters
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: isMobile ? 20 : 24, color: '#fff', fontStyle: 'italic' }}>
            One story, four views of relativity
          </div>
        </div>
        <div style={{ fontSize: 10, lineHeight: 1.8, color: colors.textDim, maxWidth: 380 }}>
          Built for learning. Physics stays exact: flat Minkowski spacetime, units with `c = 1`.
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: isMobile ? 12 : 16,
      }}>
        {experiences.map(exp => (
          <ExperienceCard key={exp.id} exp={exp} onClick={() => onSelect(exp.id)} compact={isCompact} />
        ))}
      </div>

      <div style={{
        textAlign: 'center',
        marginTop: 32,
        fontSize: 10,
        color: colors.textGhost,
        lineHeight: 1.8,
      }}>
        Follow the guided path for the clearest narrative, or jump directly into any chapter.
      </div>
    </div>
  );
}

function NavBar({ current, onSelect, onHome, currentExp, currentIndex, isCompact, isMobile }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: isMobile ? '10px 12px' : '10px 16px',
      borderBottom: `1px solid ${colors.border}`,
      background: 'rgba(7,7,12,0.95)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(8px)',
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <button
          onClick={onHome}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            fontFamily: DISPLAY,
            fontSize: isMobile ? 16 : 18,
            cursor: 'pointer',
            fontStyle: 'italic',
            padding: 0,
          }}
        >
          Minkowski Explorer
        </button>
        {!isMobile && (
          <div style={{
            fontSize: 8,
            color: colors.textGhost,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
            Guided chapter flow
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: isCompact ? '1 1 100%' : '0 1 auto' }}>
        {experiences.map(exp => (
          <button
            key={exp.id}
            onClick={() => onSelect(exp.id)}
            style={{
              background: current === exp.id ? `linear-gradient(90deg, ${exp.color}20, rgba(255,255,255,0.03))` : 'none',
              border: current === exp.id ? `1px solid ${exp.color}35` : '1px solid transparent',
              borderRadius: 999,
              color: current === exp.id ? '#fff' : colors.textDim,
              fontFamily: MONO,
              fontSize: isMobile ? 8 : 9,
              cursor: 'pointer',
              padding: isMobile ? '6px 8px' : '6px 10px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              transition: 'all 0.15s ease',
            }}
          >
            {isMobile ? exp.chapter.split(' ')[1] : `${exp.chapter.split(' ')[1]} · ${exp.title}`}
          </button>
        ))}
      </div>

      {currentExp && !isMobile && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 2,
          minWidth: 160,
        }}>
          <div style={{ fontSize: 8, color: colors.textGhost, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            {currentExp.chapter} of {experiences.length}
          </div>
          <div style={{ fontSize: 10, color: currentExp.color }}>
            {currentIndex + 1}/{experiences.length} · {currentExp.subtitle}
          </div>
        </div>
      )}
    </div>
  );
}

function ChapterHeader({ exp, index, onPrevious, onNext, hasPrevious, hasNext, isCompact, isMobile }) {
  return (
    <div style={{
      maxWidth: 1280,
      margin: '0 auto 18px',
      border: `1px solid ${colors.border}`,
      borderRadius: isMobile ? 18 : 22,
      overflow: 'hidden',
      background: `
        radial-gradient(circle at top right, ${exp.color}14, transparent 28%),
        linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))
      `,
    }}>
      <div style={{ padding: isMobile ? '16px 14px 14px' : '20px 20px 16px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: isMobile ? 14 : 20,
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: '1 1 520px', minWidth: 0 }}>
            <div style={{
              fontSize: 8,
              color: exp.color,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              {exp.chapter} · {exp.subtitle}
            </div>
            <div style={{
              fontFamily: DISPLAY,
              fontSize: isMobile ? 26 : 34,
              color: '#fff',
              fontStyle: 'italic',
              lineHeight: 1.05,
              marginBottom: 10,
            }}>
              {exp.title}
            </div>
            <div style={{ fontSize: isMobile ? 11 : 12, lineHeight: 1.8, color: 'rgba(255,255,255,0.66)', maxWidth: 760 }}>
              {exp.description}
            </div>
          </div>

          <div style={{
            flex: '0 1 340px',
            minWidth: isCompact ? '100%' : 240,
            display: 'grid',
            gap: 12,
          }}>
            <div style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 16,
              background: 'rgba(7,7,12,0.34)',
              padding: 14,
            }}>
              <div style={{ fontSize: 8, color: colors.textGhost, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 }}>
                Goal
              </div>
              <div style={{ fontSize: isMobile ? 10 : 11, lineHeight: 1.7, color: '#f4efe7' }}>
                {exp.goal}
              </div>
            </div>
            <div style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 16,
              background: 'rgba(7,7,12,0.34)',
              padding: 14,
            }}>
              <div style={{ fontSize: 8, color: colors.textGhost, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 }}>
                Takeaway
              </div>
              <div style={{ fontSize: isMobile ? 10 : 11, lineHeight: 1.7, color: colors.textDim }}>
                {exp.takeaway}
              </div>
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginTop: isMobile ? 14 : 18,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 420px', minWidth: isMobile ? 0 : 220, width: isMobile ? '100%' : undefined }}>
            {experiences.map((item, itemIndex) => (
              <div
                key={item.id}
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: isMobile ? 6 : 8,
                  borderRadius: 999,
                  background: itemIndex <= index ? item.color : 'rgba(255,255,255,0.06)',
                  opacity: itemIndex === index ? 1 : 0.6,
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: isMobile ? '100%' : undefined }}>
            <button
              onClick={onPrevious}
              disabled={!hasPrevious}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.08)',
                background: hasPrevious ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.02)',
                color: hasPrevious ? colors.textDim : colors.textGhost,
                cursor: hasPrevious ? 'pointer' : 'default',
                fontFamily: MONO,
                fontSize: isMobile ? 8 : 9,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Back
            </button>
            <button
              onClick={onNext}
              disabled={!hasNext}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border: `1px solid ${hasNext ? exp.color + '45' : 'rgba(255,255,255,0.08)'}`,
                background: hasNext ? `linear-gradient(90deg, ${exp.color}18, rgba(255,255,255,0.04))` : 'rgba(255,255,255,0.02)',
                color: hasNext ? '#fff' : colors.textGhost,
                cursor: hasNext ? 'pointer' : 'default',
                fontFamily: MONO,
                fontSize: isMobile ? 8 : 9,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const initialUrlState = typeof window === 'undefined'
    ? { activeExp: null, journeyState: DEFAULT_JOURNEY_STATE }
    : parseAppStateFromSearch(window.location.search);
  const [activeExp, setActiveExp] = useState(initialUrlState.activeExp);
  const { isCompact, isMobile } = useViewport();
  const [journeyState, setJourneyState] = useState(initialUrlState.journeyState);
  const previousActiveExpRef = useRef(initialUrlState.activeExp);

  const currentIndex = activeExp
    ? experiences.findIndex(e => e.id === activeExp)
    : -1;
  const currentExp = currentIndex >= 0 ? experiences[currentIndex] : null;
  const ActiveComponent = currentExp?.Component ?? null;
  const updateJourneyState = useCallback((patch) => {
    setJourneyState((prev) => {
      let changed = false;
      const next = { ...prev };

      Object.entries(patch).forEach(([key, value]) => {
        if (next[key] !== value) {
          next[key] = value;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, []);
  const continuityNote = currentExp?.id === 'twin-paradox'
    ? `Shared trip seed: β=${journeyState.beta.toFixed(2)}c · distance=${journeyState.tripDistance.toFixed(1)} ly`
    : currentExp?.id === 'lorentz-boost'
      ? `Continuing from Twin Paradox with β=${(journeyState.boostBeta ?? journeyState.beta).toFixed(2)}c`
      : currentExp?.id === 'reference-frames'
        ? `Comparing the same trip: β=${journeyState.beta.toFixed(2)}c · distance=${journeyState.tripDistance.toFixed(1)} ly`
        : currentExp?.id === 'light-cones'
          ? `Mission context persists here too: ${journeyState.lightConeMission.replace('-', ' ')}`
          : '';

  const goPrevious = () => {
    if (currentIndex > 0) setActiveExp(experiences[currentIndex - 1].id);
  };

  const goNext = () => {
    if (currentIndex >= 0 && currentIndex < experiences.length - 1) {
      setActiveExp(experiences[currentIndex + 1].id);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handlePopstate = () => {
      const nextState = parseAppStateFromSearch(window.location.search);
      previousActiveExpRef.current = nextState.activeExp;
      setActiveExp(nextState.activeExp);
      setJourneyState(nextState.journeyState);
    };

    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const nextUrl = buildUrlFromAppState({
      activeExp,
      journeyState,
      pathname: window.location.pathname,
      hash: window.location.hash,
    });
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (nextUrl === currentUrl) {
      previousActiveExpRef.current = activeExp;
      return;
    }

    const historyMethod = previousActiveExpRef.current !== activeExp ? 'pushState' : 'replaceState';
    window.history[historyMethod](null, '', nextUrl);
    previousActiveExpRef.current = activeExp;
  }, [activeExp, journeyState]);

  return (
    <div style={{
      background: colors.bg,
      minHeight: '100vh',
      color: colors.text,
      fontFamily: MONO,
      backgroundImage: 'radial-gradient(circle at top, rgba(255,255,255,0.025), transparent 42%)',
    }}>
      <link href={fonts.google} rel="stylesheet" />

      {activeExp ? (
        <>
          <NavBar
            current={activeExp}
            onSelect={setActiveExp}
            onHome={() => setActiveExp(null)}
            currentExp={currentExp}
            currentIndex={currentIndex}
            isCompact={isCompact}
            isMobile={isMobile}
          />
          <div style={{ padding: isMobile ? '12px 12px 20px' : '18px 20px 28px' }}>
            {currentExp && (
              <ChapterHeader
                exp={currentExp}
                index={currentIndex}
                onPrevious={goPrevious}
                onNext={goNext}
                hasPrevious={currentIndex > 0}
                hasNext={currentIndex < experiences.length - 1}
                isCompact={isCompact}
                isMobile={isMobile}
              />
            )}
            <Suspense fallback={
              <div style={{ textAlign: 'center', padding: 60, color: colors.textGhost }}>
                Loading...
              </div>
            }>
              {ActiveComponent && (
                <ActiveComponent
                  journeyState={journeyState}
                  onJourneyChange={updateJourneyState}
                />
              )}
            </Suspense>
            {currentExp && (
              <div style={{ maxWidth: 1280, margin: '18px auto 0' }}>
                <div style={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: isMobile ? 16 : 18,
                  padding: isMobile ? '12px 12px' : '14px 16px',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}>
                  <div>
                    <div style={{
                      fontSize: 8,
                      color: colors.textGhost,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      marginBottom: 4,
                    }}>
                      Up next
                    </div>
                    <div style={{ fontSize: isMobile ? 10 : 11, color: colors.textDim, lineHeight: 1.7 }}>
                      {currentIndex < experiences.length - 1
                        ? `${experiences[currentIndex + 1].title}: ${experiences[currentIndex + 1].goal}`
                        : 'You reached the sandbox chapter. From here, revisit any concept and experiment freely.'}
                    </div>
                    {continuityNote && (
                      <div style={{ fontSize: 9, color: currentExp.color, marginTop: 8, lineHeight: 1.6 }}>
                        {continuityNote}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setActiveExp(null)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 999,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(255,255,255,0.03)',
                        color: colors.textDim,
                        cursor: 'pointer',
                        fontFamily: MONO,
                        fontSize: isMobile ? 8 : 9,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Chapter Map
                    </button>
                    {currentIndex < experiences.length - 1 && (
                      <button
                        onClick={goNext}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 999,
                          border: `1px solid ${currentExp.color}45`,
                          background: `linear-gradient(90deg, ${currentExp.color}18, rgba(255,255,255,0.04))`,
                          color: '#fff',
                          cursor: 'pointer',
                          fontFamily: MONO,
                          fontSize: isMobile ? 8 : 9,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Continue
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <Landing onSelect={setActiveExp} isCompact={isCompact} isMobile={isMobile} />
      )}
    </div>
  );
}
