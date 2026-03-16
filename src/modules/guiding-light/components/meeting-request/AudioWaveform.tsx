import { cn } from "@gl/lib/utils";

interface AudioWaveformProps {
  isActive: boolean;
}

// Pre-generated random heights and delays for consistent rendering
const BARS = Array.from({ length: 40 }, (_, i) => ({
  height: 4 + Math.sin(i * 0.7) * 12 + Math.cos(i * 1.3) * 8,
  delay: (i * 0.05) % 1,
}));

function AudioWaveform({ isActive }: AudioWaveformProps) {
  return (
    <div className="flex h-16 w-full max-w-sm items-center justify-center gap-[2px]">
      {BARS.map((bar, i) => (
        <div
          key={i}
          className={cn(
            "w-[3px] rounded-full transition-all duration-300",
            isActive
              ? "animate-bounce bg-gradient-to-t from-[#E8845C] to-[#F0A882]"
              : "bg-[#E8845C]/20"
          )}
          style={{
            height: isActive ? `${bar.height + 8}px` : "4px",
            animationDelay: isActive ? `${bar.delay}s` : "0s",
            animationDuration: isActive ? "0.6s" : "0s",
          }}
        />
      ))}
    </div>
  );
}

export { AudioWaveform };
