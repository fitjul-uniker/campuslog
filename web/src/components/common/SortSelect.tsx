import type { SortOption } from "@/lib/types";

type SortSelectOption = {
  value: SortOption | string;
  label: string;
};

type SortSelectProps = {
  id?: string;
  label?: string;
  value: SortOption | string;
  options: SortSelectOption[];
  disabled?: boolean;
  helperText?: string;
  onChange?: (value: string) => void;
};

export function SortSelect({
  id = "experience-sort",
  label = "정렬",
  value,
  options,
  disabled = false,
  helperText,
  onChange,
}: SortSelectProps) {
  const helperId = helperText ? `${id}-helper` : undefined;

  return (
    <div className="list-control">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        aria-describedby={helperId}
        onChange={(event) => onChange?.(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText ? <span id={helperId}>{helperText}</span> : null}
    </div>
  );
}
