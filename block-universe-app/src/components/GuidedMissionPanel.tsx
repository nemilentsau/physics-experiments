import { colors } from '../theme.ts';
import type { MissionDefinition, MissionStatus } from '../types.ts';

interface GuidedMissionPanelProps {
  title?: string;
  accent?: string;
  missions: MissionDefinition[];
  activeId: string;
  onSelect: (id: string) => void;
  status: MissionStatus;
}

export function GuidedMissionPanel({
  title = 'Guided Missions',
  accent = colors.sliceGold,
  missions,
  activeId,
  onSelect,
  status,
}: GuidedMissionPanelProps) {
  const activeMission = missions.find((m) => m.id === activeId);

  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${accent}25`,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
        backdropFilter: 'blur(12px)',
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          fontSize: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: accent,
          marginBottom: 10,
        }}
      >
        {title}
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        {missions.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            style={{
              padding: '4px 10px',
              fontSize: 9,
              borderRadius: 999,
              border: `1px solid ${m.id === activeId ? accent : colors.border}`,
              background: m.id === activeId ? `${accent}18` : 'transparent',
              color: m.id === activeId ? accent : colors.textDim,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {m.title}
          </button>
        ))}
      </div>

      {activeMission && (
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              fontSize: 10,
              color: '#fff',
              lineHeight: 1.55,
              marginBottom: 6,
            }}
          >
            {activeMission.objective}
          </div>
          <div
            style={{
              fontSize: 9,
              color: colors.textDim,
              lineHeight: 1.5,
            }}
          >
            {activeMission.summary}
          </div>
        </div>
      )}

      <div
        style={{
          borderTop: `1px solid ${accent}15`,
          paddingTop: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: status.complete ? '#4ade80' : colors.textGhost,
            transition: 'background 0.2s ease',
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, color: status.complete ? '#4ade80' : '#fff' }}>
            {status.label}
          </div>
          <div style={{ fontSize: 8.5, color: colors.textDim, marginTop: 2 }}>
            {status.detail}
          </div>
        </div>
      </div>

      {status.complete && activeMission && (
        <div
          style={{
            marginTop: 10,
            padding: '8px 10px',
            borderRadius: 10,
            background: 'rgba(74,222,128,0.08)',
            border: '1px solid rgba(74,222,128,0.2)',
            fontSize: 9,
            lineHeight: 1.55,
            color: 'rgba(74,222,128,0.85)',
          }}
        >
          {activeMission.successText}
        </div>
      )}
    </div>
  );
}
