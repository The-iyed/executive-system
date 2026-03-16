interface RecordedWaveformProps {
  waveformData: number[];
  progress: number; // 0-1
}

function RecordedWaveform({ waveformData, progress }: RecordedWaveformProps) {
  if (waveformData.length === 0) return null;

  const progressIndex = Math.floor(progress * waveformData.length);

  return (
    <div className="flex h-10 w-full items-center justify-center gap-[2px]">
      {waveformData.map((amplitude, i) => {
        const height = Math.max(4, amplitude * 32);
        const isPlayed = i <= progressIndex;

        return (
          <div
            key={i}
            className="w-[3px] rounded-full transition-colors duration-150"
            style={{
              height: `${height}px`,
              backgroundColor: isPlayed ? "#048F86" : "rgba(4, 143, 134, 0.3)",
            }}
          />
        );
      })}
    </div>
  );
}

export { RecordedWaveform };
