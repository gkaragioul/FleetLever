export function FleetLeverIconImage() {
  return (
    <div
      style={{
        alignItems: "center",
        background: "#f8fafc",
        borderRadius: 28,
        display: "flex",
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <svg width="180" height="180" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M14.5 42.5C11.8 29.8 18.8 16.8 31.3 12.7C43.8 16.8 50.8 29.8 48.1 42.5"
          stroke="#1F2937"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M18 42L35 14" stroke="#007C89" strokeWidth="4" strokeLinecap="round" />
        <path d="M18 42H47" stroke="#1F2937" strokeWidth="4" strokeLinecap="round" />
        <circle cx="18" cy="42" r="6.5" fill="#F8FAFC" stroke="#007C89" strokeWidth="4" />
        <circle cx="35" cy="14" r="6.5" fill="#F8FAFC" stroke="#007C89" strokeWidth="4" />
        <circle cx="47" cy="42" r="6.5" fill="#F8FAFC" stroke="#1F2937" strokeWidth="4" />
      </svg>
    </div>
  );
}
