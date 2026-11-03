import { colors } from '../../rendering/theme.js';

export function GuidedMissionPanel({
  title = 'Guided Experiments',
  accent = colors.lightCone,
  missions,
  activeId,
  onSelect,
  status,
}) {
  const activeMission = missions.find((mission) => mission.id === activeId) ?? missions[0];
  const activeIndex = missions.findIndex((mission) => mission.id === activeMission.id);
  const nextMission = activeIndex >= 0 ? missions[activeIndex + 1] : null;

  return (
    <div style={{
      background: `
        radial-gradient(circle at top right, ${accent}14, transparent 32%),
        linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))
      `,
      border: `1px solid ${accent}28`,
      borderRadius: 18,
      padding: 14,
      boxShadow: `0 16px 30px ${accent}10`,
    }}>
      <div style={{
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: '0.16em',
        color: accent,
        marginBottom: 12,
      }}>
        {title}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {missions.map((mission) => {
          const active = mission.id === activeMission.id;
          return (
            <button
              key={mission.id}
              onClick={() => onSelect(mission.id)}
              style={{
                padding: '6px 10px',
                borderRadius: 999,
                border: `1px solid ${active ? accent + '45' : 'rgba(255,255,255,0.08)'}`,
                background: active ? `${accent}14` : 'rgba(255,255,255,0.03)',
                color: active ? '#fff' : colors.textDim,
                cursor: 'pointer',
                fontSize: 9,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {mission.title}
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: 11, color: '#fff', marginBottom: 6 }}>
        {activeMission.summary}
      </div>
      <div style={{ fontSize: 10, lineHeight: 1.7, color: colors.textDim, marginBottom: 10 }}>
        {activeMission.objective}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 10,
      }}>
        <div style={{
          padding: '5px 9px',
          borderRadius: 999,
          border: `1px solid ${(status?.complete ? accent : 'rgba(255,255,255,0.1)')}`,
          background: status?.complete ? `${accent}14` : 'rgba(255,255,255,0.03)',
          color: status?.complete ? '#fff' : colors.textDim,
          fontSize: 9,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>
          {status?.complete ? 'Complete' : status?.label ?? 'In progress'}
        </div>
        {activeMission.action && (
          <button
            onClick={activeMission.action}
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              border: `1px solid ${accent}35`,
              background: `${accent}10`,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 9,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Load Preset
          </button>
        )}
      </div>

      <div style={{ fontSize: 9.5, lineHeight: 1.7, color: colors.textGhost }}>
        {status?.detail ?? activeMission.successText}
      </div>

      {status?.complete && (
        <div style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 14,
          border: `1px solid ${accent}30`,
          background: `${accent}12`,
        }}>
          <div style={{
            fontSize: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            color: accent,
            marginBottom: 6,
          }}>
            Mission payoff
          </div>
          <div style={{ fontSize: 10, lineHeight: 1.7, color: '#fff', marginBottom: nextMission ? 10 : 0 }}>
            {activeMission.successText}
          </div>
          {nextMission && (
            <button
              onClick={() => onSelect(nextMission.id)}
              style={{
                padding: '6px 10px',
                borderRadius: 999,
                border: `1px solid ${accent}35`,
                background: 'rgba(7,7,12,0.28)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 9,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Next Mission: {nextMission.title}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
