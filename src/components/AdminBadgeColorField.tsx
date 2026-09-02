import { useMemo } from "react";

export const PURPLE_BADGE = "#7C3AED";

export const BADGE_PALETTE: Array<{ label: string; hex: string }> = [
  { label: "Purple", hex: PURPLE_BADGE },
  { label: "Gold", hex: "#C9A227" },
  { label: "Silver", hex: "#7D8590" },
  { label: "Bronze", hex: "#B87333" },
  { label: "Green", hex: "#0F3D26" },
  { label: "Blue", hex: "#1D9BF0" },
  { label: "Red", hex: "#E11D48" },
  { label: "Black", hex: "#141414" },
];

export function normalizeHex(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  const hex = raw.startsWith("#") ? raw : `#${raw}`;
  if (/^#([0-9a-fA-F]{3})$/.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`.toUpperCase();
  }
  if (/^#([0-9a-fA-F]{6})$/.test(hex)) return hex.toUpperCase();
  return raw.toUpperCase();
}

type Props = {
  value: string;
  onChange: (hex: string) => void;
  onSave?: () => void;
  saving?: boolean;
  disabled?: boolean;
  showSave?: boolean;
  hint?: string;
};

export default function AdminBadgeColorField({
  value,
  onChange,
  onSave,
  saving = false,
  disabled = false,
  showSave = false,
  hint,
}: Props) {
  const hex = useMemo(() => normalizeHex(value) || "", [value]);
  const valid = /^#([0-9A-F]{6})$/.test(hex);

  return (
    <div className="admin-badge-color">
      <div className="admin-badge-color__palette" role="list">
        {BADGE_PALETTE.map((swatch) => {
          const selected = hex === swatch.hex;
          return (
            <button
              key={swatch.hex}
              type="button"
              role="listitem"
              className={`admin-badge-color__swatch${
                selected ? " admin-badge-color__swatch--selected" : ""
              }`}
              style={{ background: swatch.hex }}
              title={swatch.label}
              aria-label={swatch.label}
              disabled={disabled || saving}
              onClick={() => onChange(swatch.hex)}
            />
          );
        })}
      </div>
      <div className="admin-badge-color__row">
        <label className="admin-badge-color__hex-label">
          Hex
          <input
            type="text"
            className="admin-badge-color__hex"
            value={value}
            placeholder="#7C3AED"
            maxLength={9}
            spellCheck={false}
            autoComplete="off"
            disabled={disabled || saving}
            onChange={(event) => onChange(event.target.value)}
          />
        </label>
        <span
          className="admin-badge-color__preview"
          style={{ background: valid ? hex : "#E8E4DC" }}
          aria-hidden="true"
        />
        {showSave ? (
          <button
            type="button"
            className="admin-action-btn admin-action-btn--primary"
            onClick={onSave}
            disabled={disabled || saving || (value.trim() !== "" && !valid)}
          >
            {saving ? "Saving..." : "Save color"}
          </button>
        ) : null}
      </div>
      {hint ? <p className="admin-badge-color__hint">{hint}</p> : null}
    </div>
  );
}
