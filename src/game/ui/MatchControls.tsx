const actionButtons = [
  { key: 'A', label: 'Attack' },
  { key: 'G', label: 'Grapple' },
  { key: 'R', label: 'Run' },
  { key: 'P', label: 'Pick Up' },
  { key: 'T', label: 'Taunt / Pin' },
] as const;

function FocusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
      <path
        d="M2.5 12s3.3-5 9.5-5 9.5 5 9.5 5-3.3 5-9.5 5-9.5-5-9.5-5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="2.8" fill="currentColor" />
    </svg>
  );
}

export function MatchControls() {
  return (
    <div
      data-testid="match-controls"
      className="pointer-events-none absolute inset-0 z-20 select-none"
      aria-label="Match controls"
    >
      <div className="absolute bottom-[max(18px,env(safe-area-inset-bottom))] left-[max(18px,env(safe-area-inset-left))]">
        <div
          data-testid="movement-pad"
          className="pointer-events-auto relative grid h-[clamp(112px,17vw,168px)] w-[clamp(112px,17vw,168px)] place-items-center rounded-full border border-white/30 bg-black/30 backdrop-blur-sm"
          aria-label="Movement pad placeholder"
        >
          <div className="absolute inset-[18%] rounded-full border border-white/15" />
          <div className="h-[38%] w-[38%] rounded-full border border-white/40 bg-white/18 shadow-[0_4px_18px_rgba(0,0,0,0.35)]" />
        </div>
      </div>

      <div className="absolute right-[max(18px,env(safe-area-inset-right))] bottom-[max(18px,env(safe-area-inset-bottom))] grid grid-cols-3 gap-[clamp(8px,1.2vw,14px)]">
        {actionButtons.map((button) => (
          <button
            key={button.key}
            type="button"
            data-testid={`control-${button.key.toLowerCase()}`}
            aria-label={button.label}
            className="pointer-events-auto flex h-[clamp(58px,8vw,82px)] w-[clamp(58px,8vw,82px)] flex-col items-center justify-center rounded-full border border-white/30 bg-black/45 text-zinc-100 backdrop-blur-md transition active:scale-95 active:bg-white/15"
          >
            <span className="text-[clamp(20px,2.5vw,28px)] font-black leading-none">
              {button.key}
            </span>
            <span className="mt-1 max-w-[90%] text-center text-[clamp(8px,1vw,11px)] leading-tight font-semibold text-zinc-300">
              {button.label}
            </span>
          </button>
        ))}

        <button
          type="button"
          data-testid="control-focus"
          aria-label="Focus"
          className="pointer-events-auto flex h-[clamp(58px,8vw,82px)] w-[clamp(58px,8vw,82px)] flex-col items-center justify-center rounded-full border border-white/30 bg-black/45 text-zinc-100 backdrop-blur-md transition active:scale-95 active:bg-white/15"
        >
          <FocusIcon />
          <span className="mt-1 text-[clamp(8px,1vw,11px)] leading-none font-semibold text-zinc-300">
            Focus
          </span>
        </button>
      </div>
    </div>
  );
}
