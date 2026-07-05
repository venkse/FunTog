export type MascotMood =
  | "idle" | "plotting" | "thinking" | "mischief"
  | "smug" | "wink" | "tada" | "cheer";

export interface MascotProps {
  /** which sprite state to show; idle bobs gently */
  mood?: MascotMood;
  /** rendered width in px (height follows the 240:250 viewBox) */
  size?: number;
}

/** The FunTog flame mascot. Mood is driven purely by CSS classes. */
export function Mascot({ mood = "idle", size = 180 }: MascotProps) {
  return (
    <span className={`ft-mascot ft-mascot--${mood}`} role="img" aria-label={`FunTog mascot (${mood})`}>
      <svg viewBox="0 0 240 250" width={size} height={(size * 250) / 240} aria-hidden="true">
        <defs>
          <radialGradient id="ft-m-bodyG" cx="42%" cy="34%" r="75%">
            <stop offset="0%" stopColor="#FF8676" />
            <stop offset="60%" stopColor="#FF6F61" />
            <stop offset="100%" stopColor="#E8533F" />
          </radialGradient>
          <linearGradient id="ft-m-flameG" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#FF8A3D" />
            <stop offset="55%" stopColor="#FFC24B" />
            <stop offset="100%" stopColor="#FFE08A" />
          </linearGradient>
        </defs>
        <g className="ft-m-body-group">
          <g className="ft-m-flame">
            <path d="M120 8 C133 30 128 44 120 52 C112 44 107 30 120 8 Z" fill="url(#ft-m-flameG)" />
            <circle cx="120" cy="40" r="5" fill="#FFF2C2" opacity=".85" />
          </g>
          <path d="M120 52 C176 52 196 96 196 142 C196 196 164 226 120 226 C76 226 44 196 44 142 C44 96 64 52 120 52 Z" fill="url(#ft-m-bodyG)" />
          <ellipse cx="84" cy="156" rx="13" ry="9" fill="#FF9E8A" opacity=".55" />
          <ellipse cx="156" cy="156" rx="13" ry="9" fill="#FF9E8A" opacity=".55" />
          <rect className="ft-m-brow ft-m-brow--l" x="78" y="106" width="26" height="7" rx="3.5" fill="#B23A2B" />
          <rect className="ft-m-brow ft-m-brow--r" x="136" y="106" width="26" height="7" rx="3.5" fill="#B23A2B" />
          <g>
            <ellipse cx="91" cy="130" rx="15" ry="17" fill="#fff" />
            <circle className="ft-m-pupil" cx="93" cy="132" r="7" fill="#23163B" />
            <circle cx="96" cy="129" r="2.4" fill="#fff" />
            <rect className="ft-m-eyelid ft-m-eyelid--l" x="76" y="113" width="30" height="34" rx="15" fill="url(#ft-m-bodyG)" />
          </g>
          <g>
            <ellipse cx="149" cy="130" rx="15" ry="17" fill="#fff" />
            <circle className="ft-m-pupil" cx="151" cy="132" r="7" fill="#23163B" />
            <circle cx="154" cy="129" r="2.4" fill="#fff" />
            <rect className="ft-m-eyelid ft-m-eyelid--r" x="134" y="113" width="30" height="34" rx="15" fill="url(#ft-m-bodyG)" />
          </g>
          <g>
            <path className="ft-m-mouth ft-m-mouth--smile" d="M101 176 Q120 192 139 176" stroke="#7A1E12" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path className="ft-m-mouth ft-m-mouth--smirk" d="M104 180 Q124 188 140 174" stroke="#7A1E12" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path className="ft-m-mouth ft-m-mouth--grin" d="M100 174 Q120 196 140 174 Z" fill="#7A1E12" />
            <ellipse className="ft-m-mouth ft-m-mouth--open" cx="120" cy="182" rx="15" ry="13" fill="#7A1E12" />
            <rect className="ft-m-mouth ft-m-mouth--flat" x="106" y="180" width="28" height="6" rx="3" fill="#7A1E12" />
          </g>
          <g className="ft-m-sparkles">
            <path d="M40 80 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 z" fill="#FFE08A" />
            <path d="M196 70 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="#FFD66B" />
            <path d="M186 168 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3 z" fill="#FFE08A" />
          </g>
        </g>
      </svg>
    </span>
  );
}
