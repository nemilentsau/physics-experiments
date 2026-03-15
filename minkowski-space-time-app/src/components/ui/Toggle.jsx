export function Toggle({ label, checked, onChange, color = '#00e5cc', labelStyle }) {
  return (
    <label style={{
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      fontSize: 10,
      color: 'rgba(255,255,255,0.5)',
      marginBottom: 6,
      cursor: 'pointer',
      ...labelStyle,
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onChange(!checked)}
        style={{ accentColor: color }}
      />
      {label}
    </label>
  );
}
