import Link from "next/link";

export default function Logo({
  className = "",
  size = "md",
  variant = "dark",
  href,
}) {
  const isLight = variant === "light";

  const sizeClasses = {
    sm: {
      mark: "w-7 h-7",
      text: "text-2xl",
      sub: "text-[7.5px] tracking-[0.24em]",
    },
    md: {
      mark: "w-9 h-9",
      text: "text-3xl",
      sub: "text-[8.5px] tracking-[0.26em]",
    },
    lg: {
      mark: "w-11 h-11",
      text: "text-4xl",
      sub: "text-[10px] tracking-[0.3em]",
    },
  }[size] || {
    mark: "w-9 h-9",
    text: "text-3xl",
    sub: "text-[8.5px] tracking-[0.26em]",
  };

  const content = (
    <div className={`flex items-center gap-3 group select-none ${className}`}>
      {/* Overlapping organic dual pebble emblem from screenshot */}
      <div className={`${sizeClasses.mark} relative flex-shrink-0`}>
        <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
          {/* Back sage / muted green leaf pebble */}
          <path
            d="M 14 14 C 14 6, 26 6, 32 14 C 38 22, 34 32, 26 34 C 18 36, 14 28, 14 14 Z"
            fill="#8EA996"
            fillOpacity="0.75"
          />
          {/* Front deep forest green leaf pebble */}
          <path
            d="M 6 10 C 6 2, 20 2, 24 10 C 28 18, 24 28, 16 30 C 8 32, 6 22, 6 10 Z"
            fill={isLight ? "#FFFEFA" : "#073F2E"}
          />
        </svg>
      </div>

      {/* Brand Name + Subtext */}
      <div className="flex flex-col justify-center leading-none">
        <span
          style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          className={`${sizeClasses.text} font-bold tracking-tight transition-colors duration-200 ${
            isLight ? "text-white" : "text-[#073F2E]"
          }`}
        >
          Gather
        </span>
        <span
          className={`font-sans font-bold uppercase mt-1 ${sizeClasses.sub} ${
            isLight ? "text-white/70" : "text-[#77776F]"
          }`}
        >
          CURATED SESSIONS
        </span>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {content}
      </Link>
    );
  }

  return content;
}
