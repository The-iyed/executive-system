export function SSOLoader() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif",
      }}
    >
      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.7; }
          }
        `}
      </style>
      <img
        src="/assets/ministry.svg"
        alt=""
        style={{
          width: '120px',
          height: 'auto',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
    </div>
  );
}
