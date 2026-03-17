import { useState, Suspense, useCallback, useEffect, useRef } from 'react';
import type { ChapterState, ChapterDefinition } from './types.ts';
import { MONO, DISPLAY, colors } from './theme.ts';
import { useViewport } from './hooks/useViewport.ts';
import { chapters } from './chapters/registry.ts';
import { LandingPage } from './components/LandingPage.tsx';
import { ProgressHeader } from './components/ProgressHeader.tsx';
import {
  DEFAULT_CHAPTER_STATE,
  serializeChapterState,
  deserializeChapterState,
} from './state/shareableState.ts';

function parseUrlState(): { activeChapter: string | null; chapterState: ChapterState } {
  if (typeof window === 'undefined') return { activeChapter: null, chapterState: { ...DEFAULT_CHAPTER_STATE } };
  const state = deserializeChapterState(window.location.search);
  return { activeChapter: state.chapter, chapterState: state };
}

interface NavBarProps {
  current: string;
  onSelect: (id: string) => void;
  onHome: () => void;
  currentChapter: ChapterDefinition | null;
  currentIndex: number;
  isCompact: boolean;
  isMobile: boolean;
}

function NavBar({ current, onSelect, onHome, currentChapter, currentIndex, isCompact, isMobile }: NavBarProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      padding: isMobile ? '10px 12px' : '10px 16px', borderBottom: `1px solid ${colors.border}`,
      background: 'rgba(7,7,12,0.95)', position: 'sticky', top: 0, zIndex: 100,
      backdropFilter: 'blur(8px)', flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <button onClick={onHome} style={{ background: 'none', border: 'none', color: '#fff', fontFamily: DISPLAY, fontSize: isMobile ? 16 : 18, cursor: 'pointer', fontStyle: 'italic', padding: 0 }}>
          Block Universe
        </button>
        {!isMobile && (
          <div style={{ fontSize: 8, color: colors.textGhost, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            Guided chapter flow
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: isCompact ? '1 1 100%' : '0 1 auto' }}>
        {chapters.map(ch => (
          <button key={ch.id} onClick={() => onSelect(ch.id)} style={{
            background: current === ch.id ? `linear-gradient(90deg, ${ch.color}20, rgba(255,255,255,0.03))` : 'none',
            border: current === ch.id ? `1px solid ${ch.color}35` : '1px solid transparent',
            borderRadius: 999, color: current === ch.id ? '#fff' : colors.textDim, fontFamily: MONO,
            fontSize: isMobile ? 8 : 9, cursor: 'pointer', padding: isMobile ? '6px 8px' : '6px 10px',
            letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'all 0.15s ease',
          }}>
            {isMobile ? ch.chapter.split(' ')[1] : `${ch.chapter.split(' ')[1]} \u00B7 ${ch.title}`}
          </button>
        ))}
      </div>
      {currentChapter && !isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, minWidth: 160 }}>
          <div style={{ fontSize: 8, color: colors.textGhost, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            {currentChapter.chapter} of {chapters.length}
          </div>
          <div style={{ fontSize: 10, color: currentChapter.color }}>
            {currentIndex + 1}/{chapters.length} \u00B7 {currentChapter.subtitle}
          </div>
        </div>
      )}
    </div>
  );
}

interface ChapterHeaderProps {
  ch: ChapterDefinition;
  index: number;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  isCompact: boolean;
  isMobile: boolean;
}

function ChapterHeader({ ch, index, onPrevious, onNext, hasPrevious, hasNext, isCompact, isMobile }: ChapterHeaderProps) {
  return (
    <div style={{
      maxWidth: 1280, margin: '0 auto 18px', border: `1px solid ${colors.border}`,
      borderRadius: isMobile ? 18 : 22, overflow: 'hidden',
      background: `radial-gradient(circle at top right, ${ch.color}14, transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))`,
    }}>
      <div style={{ padding: isMobile ? '16px 14px 14px' : '20px 20px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: isMobile ? 14 : 20, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 520px', minWidth: 0 }}>
            <div style={{ fontSize: 8, color: ch.color, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
              {ch.chapter} \u00B7 {ch.subtitle}
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: isMobile ? 26 : 34, color: '#fff', fontStyle: 'italic', lineHeight: 1.05, marginBottom: 10 }}>
              {ch.title}
            </div>
            <div style={{ fontSize: isMobile ? 11 : 12, lineHeight: 1.8, color: 'rgba(255,255,255,0.66)', maxWidth: 760 }}>
              {ch.description}
            </div>
          </div>
          <div style={{ flex: '0 1 340px', minWidth: isCompact ? '100%' : 240, display: 'grid', gap: 12 }}>
            <div style={{ border: `1px solid ${colors.border}`, borderRadius: 16, background: 'rgba(7,7,12,0.34)', padding: 14 }}>
              <div style={{ fontSize: 8, color: colors.textGhost, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 }}>Goal</div>
              <div style={{ fontSize: isMobile ? 10 : 11, lineHeight: 1.7, color: '#f4efe7' }}>{ch.goal}</div>
            </div>
            <div style={{ border: `1px solid ${colors.border}`, borderRadius: 16, background: 'rgba(7,7,12,0.34)', padding: 14 }}>
              <div style={{ fontSize: 8, color: colors.textGhost, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 }}>Takeaway</div>
              <div style={{ fontSize: isMobile ? 10 : 11, lineHeight: 1.7, color: colors.textDim }}>{ch.takeaway}</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: isMobile ? 14 : 18, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 420px', minWidth: isMobile ? 0 : 220, width: isMobile ? '100%' : undefined }}>
            <ProgressHeader chapters={chapters} currentIndex={index} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: isMobile ? '100%' : undefined }}>
            <button onClick={onPrevious} disabled={!hasPrevious} style={{
              padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)',
              background: hasPrevious ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.02)',
              color: hasPrevious ? colors.textDim : colors.textGhost,
              cursor: hasPrevious ? 'pointer' : 'default', fontFamily: MONO,
              fontSize: isMobile ? 8 : 9, letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>Back</button>
            <button onClick={onNext} disabled={!hasNext} style={{
              padding: '8px 12px', borderRadius: 999,
              border: `1px solid ${hasNext ? ch.color + '45' : 'rgba(255,255,255,0.08)'}`,
              background: hasNext ? `linear-gradient(90deg, ${ch.color}18, rgba(255,255,255,0.04))` : 'rgba(255,255,255,0.02)',
              color: hasNext ? '#fff' : colors.textGhost,
              cursor: hasNext ? 'pointer' : 'default', fontFamily: MONO,
              fontSize: isMobile ? 8 : 9, letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const initial = parseUrlState();
  const [activeChapter, setActiveChapter] = useState<string | null>(initial.activeChapter);
  const [chapterState, setChapterState] = useState<ChapterState>(initial.chapterState);
  const { isCompact, isMobile } = useViewport();
  const prevChapterRef = useRef<string | null>(initial.activeChapter);

  const currentIndex = activeChapter ? chapters.findIndex(c => c.id === activeChapter) : -1;
  const currentCh = currentIndex >= 0 ? chapters[currentIndex]! : null;
  const ActiveComponent = currentCh?.Component ?? null;

  const updateChapterState = useCallback((patch: Partial<ChapterState>) => {
    setChapterState(prev => {
      let changed = false;
      const next = { ...prev };
      for (const [key, value] of Object.entries(patch)) {
        if ((next as Record<string, unknown>)[key] !== value) {
          (next as Record<string, unknown>)[key] = value;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  const goPrevious = () => {
    if (currentIndex > 0) setActiveChapter(chapters[currentIndex - 1]!.id);
  };
  const goNext = () => {
    if (currentIndex >= 0 && currentIndex < chapters.length - 1) setActiveChapter(chapters[currentIndex + 1]!.id);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopstate = () => {
      const state = parseUrlState();
      prevChapterRef.current = state.activeChapter;
      setActiveChapter(state.activeChapter);
      setChapterState(state.chapterState);
    };
    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const nextSearch = serializeChapterState({ ...chapterState, chapter: activeChapter });
    const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextUrl === currentUrl) { prevChapterRef.current = activeChapter; return; }
    const method = prevChapterRef.current !== activeChapter ? 'pushState' : 'replaceState';
    window.history[method](null, '', nextUrl);
    prevChapterRef.current = activeChapter;
  }, [activeChapter, chapterState]);

  return (
    <div style={{
      background: colors.bg, minHeight: '100vh', color: colors.text, fontFamily: MONO,
      backgroundImage: 'radial-gradient(circle at top, rgba(255,255,255,0.025), transparent 42%)',
    }}>
      {activeChapter ? (
        <>
          <NavBar current={activeChapter} onSelect={setActiveChapter} onHome={() => setActiveChapter(null)}
            currentChapter={currentCh} currentIndex={currentIndex} isCompact={isCompact} isMobile={isMobile} />
          <div style={{ padding: isMobile ? '12px 12px 20px' : '18px 20px 28px' }}>
            {currentCh && (
              <ChapterHeader ch={currentCh} index={currentIndex} onPrevious={goPrevious} onNext={goNext}
                hasPrevious={currentIndex > 0} hasNext={currentIndex < chapters.length - 1}
                isCompact={isCompact} isMobile={isMobile} />
            )}
            <Suspense fallback={<div style={{ textAlign: 'center', padding: 60, color: colors.textGhost }}>Loading...</div>}>
              {ActiveComponent && <ActiveComponent chapterState={chapterState} onStateChange={updateChapterState} />}
            </Suspense>
            {currentCh && (
              <div style={{ maxWidth: 1280, margin: '18px auto 0' }}>
                <div style={{
                  border: `1px solid ${colors.border}`, borderRadius: isMobile ? 16 : 18,
                  padding: isMobile ? '12px 12px' : '14px 16px',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
                }}>
                  <div>
                    <div style={{ fontSize: 8, color: colors.textGhost, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 4 }}>Up next</div>
                    <div style={{ fontSize: isMobile ? 10 : 11, color: colors.textDim, lineHeight: 1.7 }}>
                      {currentIndex < chapters.length - 1
                        ? `${chapters[currentIndex + 1]!.title}: ${chapters[currentIndex + 1]!.goal}`
                        : 'You have completed all chapters. Revisit any chapter or experiment freely.'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => setActiveChapter(null)} style={{
                      padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.03)', color: colors.textDim, cursor: 'pointer',
                      fontFamily: MONO, fontSize: isMobile ? 8 : 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                    }}>Chapter Map</button>
                    {currentIndex < chapters.length - 1 && (
                      <button onClick={goNext} style={{
                        padding: '8px 12px', borderRadius: 999,
                        border: `1px solid ${currentCh.color}45`,
                        background: `linear-gradient(90deg, ${currentCh.color}18, rgba(255,255,255,0.04))`,
                        color: '#fff', cursor: 'pointer', fontFamily: MONO,
                        fontSize: isMobile ? 8 : 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                      }}>Continue</button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <LandingPage chapters={chapters} onSelect={setActiveChapter} isCompact={isCompact} isMobile={isMobile} />
      )}
    </div>
  );
}
