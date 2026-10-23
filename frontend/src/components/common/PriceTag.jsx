import { IndianRupee } from "lucide-react";

export default function PriceTag({
  amount = 0,
  isFree = false,
  className = "",
  iconClassName = "w-3.5 h-3.5",
  textClassName = "text-[17px] font-bold tracking-tight text-[#171915]",
  freeLabel = "Free",
  suffix = null,
}) {
  if (isFree || amount === 0) {
    return (
      <span className={`inline-flex items-center font-sans font-bold text-[#073F2E] ${className}`}>
        {freeLabel}
      </span>
    );
  }

  const formattedAmount =
    typeof amount === "number" ? amount.toLocaleString("en-IN") : amount;

  return (
    <div className={`inline-flex items-center font-sans ${className}`}>
      <IndianRupee className={`${iconClassName} text-[#073F2E] stroke-[2.5] mr-0.5 shrink-0`} />
      <span className={textClassName}>{formattedAmount}</span>
      {suffix && <span className="ml-1 text-xs font-normal text-[#77776F]">{suffix}</span>}
    </div>
  );
}
