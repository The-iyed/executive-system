import { cn } from "@gl/lib/utils";

/* ─── Empty-state: calendar / no meetings ─── */
function EmptyCalendarSVG({ className }: { className?: string }) {
  return (
    <svg className={cn("size-36", className)} viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Soft background circle */}
      <circle cx="120" cy="124" r="80" className="fill-primary/[0.04]" />
      
      {/* Calendar body */}
      <rect x="60" y="72" width="120" height="100" rx="14" className="fill-card stroke-border/60" strokeWidth="1.5" />
      
      {/* Calendar header */}
      <rect x="60" y="72" width="120" height="30" rx="14" className="fill-primary/[0.07]" />
      <rect x="60" y="88" width="120" height="14" className="fill-primary/[0.07]" />
      
      {/* Calendar rings */}
      <rect x="88" y="64" width="6" height="16" rx="3" className="fill-primary/25" />
      <rect x="146" y="64" width="6" height="16" rx="3" className="fill-primary/25" />
      
      {/* Day dots - row 1 */}
      <circle cx="84" cy="118" r="4" className="fill-muted-foreground/[0.07]" />
      <circle cx="104" cy="118" r="4" className="fill-muted-foreground/[0.07]" />
      <circle cx="124" cy="118" r="4" className="fill-primary/15" />
      <circle cx="144" cy="118" r="4" className="fill-muted-foreground/[0.07]" />
      <circle cx="164" cy="118" r="4" className="fill-muted-foreground/[0.07]" />
      
      {/* Day dots - row 2 */}
      <circle cx="84" cy="138" r="4" className="fill-muted-foreground/[0.07]" />
      <circle cx="104" cy="138" r="4" className="fill-muted-foreground/[0.07]" />
      <circle cx="124" cy="138" r="4" className="fill-muted-foreground/[0.07]" />
      <circle cx="144" cy="138" r="4" className="fill-muted-foreground/[0.07]" />
      <circle cx="164" cy="138" r="4" className="fill-muted-foreground/[0.07]" />
      
      {/* Day dots - row 3 */}
      <circle cx="84" cy="158" r="4" className="fill-muted-foreground/[0.07]" />
      <circle cx="104" cy="158" r="4" className="fill-muted-foreground/[0.07]" />
      <circle cx="124" cy="158" r="4" className="fill-muted-foreground/[0.07]" />

      {/* Floating checkmark badge */}
      <circle cx="168" cy="160" r="16" className="fill-primary/10 stroke-primary/20" strokeWidth="1" />
      <path d="M160 160l5 5 10-10" className="stroke-primary/50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      
      {/* Decorative dots */}
      <circle cx="52" cy="96" r="3" className="fill-primary/10" />
      <circle cx="196" cy="108" r="2" className="fill-primary/8" />
    </svg>
  );
}

/* ─── Empty-state: no conversations / chat ─── */
function EmptyChatSVG({ className }: { className?: string }) {
  return (
    <svg className={cn("size-36", className)} viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Soft background */}
      <circle cx="120" cy="120" r="76" className="fill-primary/[0.03]" />
      
      {/* Main bubble */}
      <rect x="48" y="64" width="108" height="68" rx="18" className="fill-card stroke-border/60" strokeWidth="1.5" />
      <polygon points="72,132 64,150 88,132" className="fill-card stroke-border/60" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Cover the inner line of tail */}
      <rect x="73" y="130" width="14" height="4" className="fill-card" />
      
      {/* Lines in main bubble */}
      <rect x="66" y="84" width="64" height="5" rx="2.5" className="fill-muted-foreground/[0.08]" />
      <rect x="66" y="96" width="48" height="5" rx="2.5" className="fill-muted-foreground/[0.06]" />
      <rect x="66" y="108" width="56" height="5" rx="2.5" className="fill-muted-foreground/[0.05]" />
      
      {/* Reply bubble */}
      <rect x="108" y="126" width="84" height="48" rx="14" className="fill-primary/[0.06] stroke-primary/15" strokeWidth="1" />
      <polygon points="168,174 176,188 156,174" className="fill-primary/[0.06] stroke-primary/15" strokeWidth="1" strokeLinejoin="round" />
      <rect x="157" y="172" width="10" height="4" className="fill-primary/[0.06]" />
      
      {/* Lines in reply bubble */}
      <rect x="122" y="142" width="52" height="4" rx="2" className="fill-primary/10" />
      <rect x="122" y="152" width="38" height="4" rx="2" className="fill-primary/[0.07]" />
      
      {/* Sparkles */}
      <circle cx="176" cy="72" r="4" className="fill-primary/12" />
      <circle cx="188" cy="86" r="2.5" className="fill-primary/8" />
      <circle cx="44" cy="148" r="2.5" className="fill-primary/8" />
    </svg>
  );
}

/* ─── Empty-state: no directives / requests ─── */
function EmptyRequestsSVG({ className }: { className?: string }) {
  return (
    <svg className={cn("size-36", className)} viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Soft background */}
      <circle cx="120" cy="122" r="78" className="fill-primary/[0.03]" />
      
      {/* Document shadow */}
      <rect x="72" y="54" width="100" height="136" rx="12" className="fill-muted-foreground/[0.03]" transform="translate(3, 3)" />
      
      {/* Main document */}
      <rect x="72" y="54" width="100" height="136" rx="12" className="fill-card stroke-border/60" strokeWidth="1.5" />
      
      {/* Document header stripe */}
      <rect x="72" y="54" width="100" height="28" rx="12" className="fill-primary/[0.05]" />
      <rect x="72" y="70" width="100" height="12" className="fill-primary/[0.05]" />
      
      {/* Header icon placeholder */}
      <circle cx="156" cy="68" r="6" className="fill-primary/10" />
      
      {/* Content lines */}
      <rect x="88" y="96" width="64" height="5" rx="2.5" className="fill-muted-foreground/[0.08]" />
      <rect x="88" y="110" width="52" height="5" rx="2.5" className="fill-muted-foreground/[0.06]" />
      <rect x="88" y="124" width="58" height="5" rx="2.5" className="fill-muted-foreground/[0.06]" />
      <rect x="88" y="138" width="40" height="5" rx="2.5" className="fill-muted-foreground/[0.05]" />
      
      {/* Separator line */}
      <line x1="88" y1="154" x2="156" y2="154" className="stroke-border/40" strokeWidth="1" />
      
      {/* Bottom action area */}
      <rect x="88" y="164" width="36" height="10" rx="5" className="fill-primary/[0.08]" />
      
      {/* Floating badge */}
      <circle cx="162" cy="168" r="14" className="fill-primary/10 stroke-primary/20" strokeWidth="1" />
      <path d="M155 168l4 4 8-8" className="stroke-primary/45" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      
      {/* Decorative elements */}
      <circle cx="64" cy="80" r="3" className="fill-primary/8" />
      <circle cx="180" cy="100" r="2" className="fill-primary/6" />
    </svg>
  );
}

/* ─── Empty-state: no agents ─── */
function EmptyAgentsSVG({ className }: { className?: string }) {
  return (
    <svg className={cn("size-36", className)} viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Soft background */}
      <circle cx="120" cy="120" r="76" className="fill-primary/[0.03]" />
      
      {/* Head */}
      <rect x="76" y="68" width="88" height="72" rx="22" className="fill-card stroke-border/60" strokeWidth="1.5" />
      
      {/* Eyes */}
      <ellipse cx="100" cy="98" rx="8" ry="9" className="fill-primary/[0.08]" />
      <ellipse cx="140" cy="98" rx="8" ry="9" className="fill-primary/[0.08]" />
      <circle cx="101" cy="97" r="3.5" className="fill-primary/30" />
      <circle cx="141" cy="97" r="3.5" className="fill-primary/30" />
      {/* Eye highlights */}
      <circle cx="103" cy="95" r="1.2" className="fill-card" />
      <circle cx="143" cy="95" r="1.2" className="fill-card" />
      
      {/* Smile */}
      <path d="M108 116 q12 10 24 0" className="stroke-primary/20" strokeWidth="2" fill="none" strokeLinecap="round" />
      
      {/* Antenna */}
      <line x1="120" y1="68" x2="120" y2="52" className="stroke-border/60" strokeWidth="1.5" />
      <circle cx="120" cy="48" r="6" className="fill-primary/[0.08] stroke-primary/20" strokeWidth="1" />
      <circle cx="120" cy="48" r="2" className="fill-primary/25" />
      
      {/* Body */}
      <rect x="84" y="146" width="72" height="36" rx="12" className="fill-card stroke-border/60" strokeWidth="1.5" />
      
      {/* Body detail */}
      <circle cx="120" cy="162" r="5" className="fill-primary/10 stroke-primary/15" strokeWidth="1" />
      
      {/* Arms */}
      <rect x="56" y="150" width="24" height="8" rx="4" className="fill-card stroke-border/50" strokeWidth="1" />
      <rect x="160" y="150" width="24" height="8" rx="4" className="fill-card stroke-border/50" strokeWidth="1" />
      
      {/* Sparkles */}
      <circle cx="172" cy="72" r="3.5" className="fill-primary/12" />
      <circle cx="184" cy="84" r="2" className="fill-primary/8" />
      <circle cx="60" cy="112" r="2" className="fill-primary/6" />
    </svg>
  );
}

/* ─── Empty-state: no search results ─── */
function EmptySearchSVG({ className }: { className?: string }) {
  return (
    <svg className={cn("size-36", className)} viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Soft background */}
      <circle cx="112" cy="108" r="72" className="fill-primary/[0.03]" />
      
      {/* Magnifier body */}
      <circle cx="108" cy="104" r="40" className="fill-card stroke-border/60" strokeWidth="2" />
      <circle cx="108" cy="104" r="28" className="fill-background stroke-muted-foreground/10" strokeWidth="1.5" />
      
      {/* Handle */}
      <line x1="138" y1="134" x2="170" y2="166" className="stroke-border/80" strokeWidth="8" strokeLinecap="round" />
      <line x1="138" y1="134" x2="170" y2="166" className="fill-card stroke-muted/80" strokeWidth="4" strokeLinecap="round" />
      
      {/* Empty indicator - subtle dash */}
      <line x1="96" y1="104" x2="120" y2="104" className="stroke-muted-foreground/12" strokeWidth="2" strokeLinecap="round" />
      
      {/* Floating elements */}
      <circle cx="168" cy="76" r="3" className="fill-primary/10" />
      <circle cx="56" cy="88" r="2.5" className="fill-primary/8" />
      <circle cx="176" cy="92" r="2" className="fill-primary/6" />
    </svg>
  );
}

/* ─── Error state ─── */
function ErrorStateSVG({ className }: { className?: string }) {
  return (
    <svg className={cn("size-36", className)} viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Soft background */}
      <circle cx="120" cy="116" r="72" className="fill-destructive/[0.03]" />
      
      {/* Cloud */}
      <ellipse cx="120" cy="104" rx="56" ry="36" className="fill-card stroke-destructive/15" strokeWidth="1.5" />
      <ellipse cx="84" cy="106" rx="28" ry="22" className="fill-card stroke-destructive/10" strokeWidth="1" />
      <ellipse cx="156" cy="106" rx="24" ry="20" className="fill-card stroke-destructive/10" strokeWidth="1" />
      {/* Fill inner overlap */}
      <ellipse cx="120" cy="108" rx="52" ry="30" className="fill-card" />
      
      {/* Lightning */}
      <path d="M116 88 l-6 20 h12 l-6 20" className="stroke-destructive/30" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      
      {/* Rain drops */}
      <line x1="92" y1="144" x2="92" y2="154" className="stroke-destructive/10" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="120" y1="140" x2="120" y2="156" className="stroke-destructive/12" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="148" y1="144" x2="148" y2="152" className="stroke-destructive/10" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Warning badge */}
      <circle cx="164" cy="76" r="12" className="fill-destructive/[0.06] stroke-destructive/20" strokeWidth="1" />
      <line x1="164" y1="70" x2="164" y2="78" className="stroke-destructive/35" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="164" cy="82" r="1.2" className="fill-destructive/35" />
    </svg>
  );
}

/* ─── Reusable wrapper ─── */
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}>
      {icon}
      <h3 className="text-[15px] font-semibold text-foreground mt-3 mb-1">{title}</h3>
      {description && <p className="text-[13px] text-muted-foreground/50 max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

function ErrorState({ title = "حدث خطأ", description, onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-6 text-center rounded-2xl border border-destructive/20 bg-destructive/[0.03]", className)}>
      <ErrorStateSVG className="size-28 mb-2" />
      <h3 className="text-[15px] font-semibold text-destructive mt-2 mb-1">{title}</h3>
      {description && <p className="text-[13px] text-destructive/60 max-w-xs leading-relaxed">{description}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-xl bg-destructive/10 px-5 py-2 text-sm font-medium text-destructive hover:bg-destructive/15 active:scale-[0.97] transition-all"
        >
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}

export {
  EmptyCalendarSVG,
  EmptyChatSVG,
  EmptyRequestsSVG,
  EmptyAgentsSVG,
  EmptySearchSVG,
  ErrorStateSVG,
  EmptyState,
  ErrorState,
};
