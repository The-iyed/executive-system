interface AiRecommendationBannerProps {
  recommendeeName: string;
}

function AiRecommendationBanner({
  recommendeeName,
}: AiRecommendationBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-[#1a1a2e] p-4">
      {/* Decorative M SVGs */}
      <svg
        width="120"
        height="53"
        viewBox="0 0 72 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute -left-4 -top-2 opacity-[0.07]"
      >
        <path
          d="M37.8174 0C42.1018 0 45.5752 3.47342 45.5752 7.75781L36.7773 32H25.5352L33.8447 7.75781H20.04L11.2422 32H0L8.30957 7.75781H20.04L22.7871 0H37.8174ZM63.3535 0C67.6377 0.000224723 71.1113 3.47356 71.1113 7.75781L62.3135 32H51.0713L59.3809 7.75781H45.5762L48.3232 0H63.3535Z"
          fill="white"
        />
      </svg>
      <svg
        width="80"
        height="35"
        viewBox="0 0 72 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute -bottom-1 right-8 opacity-[0.05] rotate-12"
      >
        <path
          d="M37.8174 0C42.1018 0 45.5752 3.47342 45.5752 7.75781L36.7773 32H25.5352L33.8447 7.75781H20.04L11.2422 32H0L8.30957 7.75781H20.04L22.7871 0H37.8174ZM63.3535 0C67.6377 0.000224723 71.1113 3.47356 71.1113 7.75781L62.3135 32H51.0713L59.3809 7.75781H45.5762L48.3232 0H63.3535Z"
          fill="white"
        />
      </svg>
      <svg
        width="50"
        height="22"
        viewBox="0 0 72 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute bottom-1 left-20 opacity-[0.04]"
      >
        <path
          d="M37.8174 0C42.1018 0 45.5752 3.47342 45.5752 7.75781L36.7773 32H25.5352L33.8447 7.75781H20.04L11.2422 32H0L8.30957 7.75781H20.04L22.7871 0H37.8174ZM63.3535 0C67.6377 0.000224723 71.1113 3.47356 71.1113 7.75781L62.3135 32H51.0713L59.3809 7.75781H45.5762L48.3232 0H63.3535Z"
          fill="white"
        />
      </svg>

      {/* Content */}
      <div className="relative z-10 flex items-center gap-3">
        <p className="flex-1 text-sm leading-relaxed text-white/80">
          ينصحكم بالنظام بتفويض هذا الاجتماع إلى السيد{" "}
          <span className="font-bold text-primary">{recommendeeName}</span>
        </p>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
          <svg
            width="20"
            height="9"
            viewBox="0 0 72 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M37.8174 0C42.1018 0 45.5752 3.47342 45.5752 7.75781L36.7773 32H25.5352L33.8447 7.75781H20.04L11.2422 32H0L8.30957 7.75781H20.04L22.7871 0H37.8174ZM63.3535 0C67.6377 0.000224723 71.1113 3.47356 71.1113 7.75781L62.3135 32H51.0713L59.3809 7.75781H45.5762L48.3232 0H63.3535Z"
              fill="url(#paint_icon_m)"
            />
            <defs>
              <linearGradient id="paint_icon_m" x1="56.5658" y1="0" x2="0" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#5BAB87" />
                <stop offset="1" stopColor="#3B6064" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
}

export { AiRecommendationBanner };
