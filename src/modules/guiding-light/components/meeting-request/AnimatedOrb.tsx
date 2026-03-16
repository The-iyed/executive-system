import { cn } from "@gl/lib/utils";

interface AnimatedOrbProps {
  isActive: boolean;
}

function AnimatedOrb({ isActive }: AnimatedOrbProps) {
  return (
    <div className="relative flex size-40 items-center justify-center">
      {/* Outer glow ring */}
      <div
        className={cn(
          "absolute size-36 rounded-full bg-gradient-to-b from-[#6DCDCD]/15 to-[#048F86]/10 transition-opacity duration-500",
          isActive ? "animate-ping opacity-100" : "opacity-0"
        )}
        style={{ animationDuration: "2.5s" }}
      />
      {/* Middle glow ring */}
      <div
        className={cn(
          "absolute size-28 rounded-full bg-gradient-to-b from-[#6DCDCD]/25 to-[#048F86]/15 transition-opacity duration-500",
          isActive ? "animate-pulse opacity-100" : "opacity-0"
        )}
      />
      {/* Core orb */}
      <div
        className={cn(
          "relative size-20 rounded-full shadow-lg transition-transform duration-700",
          isActive && "scale-105"
        )}
        style={{
          background:
            "radial-gradient(circle at 35% 35%, #9CE0DB, #6DCDCD, #048F86, #036B64)",
        }}
      />
    </div>
  );
}

export { AnimatedOrb };
