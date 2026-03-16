import aounLogo from "@gl/assets/icons/aoun-logo.svg";

interface AounEmptyStateProps {
  onSuggestionClick: (prompt: string) => void;
}

function AounEmptyState({ onSuggestionClick }: AounEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center select-none px-4">
      <div className="aoun-float-up mb-6" style={{ animationDelay: "0s" }}>
        <img src={aounLogo} alt="عون" className="size-16 md:size-20" />
      </div>
      <div className="aoun-float-up" style={{ animationDelay: "0.1s" }}>
        <h1 className="text-[2.5rem] md:text-5xl font-bold tracking-tight text-foreground leading-tight">
          كيف يمكنني مساعدتك؟
        </h1>
      </div>
    </div>
  );
}

export { AounEmptyState };
