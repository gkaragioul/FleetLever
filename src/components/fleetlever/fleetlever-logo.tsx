export function FleetLeverLogo({
  compact = false,
  inverse = false,
}: {
  compact?: boolean;
  inverse?: boolean;
}) {
  const ink = inverse ? "#EAF2EF" : "#1F2937";
  const teal = inverse ? "#5EDBE4" : "#007C89";
  const nodeFill = inverse ? "#0D2F2D" : "#F8FAFC";

  return (
    <div className="flex items-center gap-3" aria-label="FleetLever">
      <svg
        className="h-11 w-11 shrink-0"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M14.5 42.5C11.8 29.8 18.8 16.8 31.3 12.7C43.8 16.8 50.8 29.8 48.1 42.5"
          stroke={ink}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18 42L35 14"
          stroke={teal}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M18 42H47"
          stroke={ink}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="18" cy="42" r="6.5" fill={nodeFill} stroke={teal} strokeWidth="4" />
        <circle cx="35" cy="14" r="6.5" fill={nodeFill} stroke={teal} strokeWidth="4" />
        <circle cx="47" cy="42" r="6.5" fill={nodeFill} stroke={ink} strokeWidth="4" />
      </svg>

      {!compact && (
        <div className="leading-none">
          <p className={`text-[1.72rem] font-semibold tracking-normal ${inverse ? "text-white" : "text-slate-900"}`}>
            Fleet<span className={inverse ? "text-[#5EDBE4]" : "text-[#007C89]"}>Lever</span>
          </p>
        </div>
      )}
    </div>
  );
}
