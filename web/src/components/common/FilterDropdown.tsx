import type { FilterOption } from "@/lib/types";

type FilterDropdownOption = {
  value: FilterOption | string;
  label: string;
};

type FilterDropdownProps = {
  id?: string;
  label?: string;
  value: FilterOption | string;
  options: FilterDropdownOption[];
  disabled?: boolean;
  helperText?: string;
  onChange?: (value: string) => void;
};

export function FilterDropdown({
  id = "experience-filter",
  label = "필터",
  value,
  options,
  disabled = false,
  helperText,
  onChange,
}: FilterDropdownProps) {
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
