import { type InputHTMLAttributes, forwardRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "checked" | "onChange" | "size"> {
  /** Whether the checkbox is checked */
  checked?: boolean;
  /** Callback when checkbox state changes */
  onChange?: (checked: boolean) => void;
  /** Label text displayed next to the checkbox */
  label?: string;
  /** Optional class name for the wrapper */
  wrapperClassName?: string;
  /** Size variant */
  size?: "default" | "sm" | "lg";
}

const sizeClasses = {
  sm: "w-4 h-4",
  default: "w-5 h-5",
  lg: "w-6 h-6",
};

const checkIconSizes = {
  sm: "w-2.5 h-2.5",
  default: "w-3 h-3",
  lg: "w-4 h-4",
};

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      checked = false,
      onChange,
      label,
      disabled = false,
      wrapperClassName,
      size = "default",
      id,
      ...props
    },
    ref
  ) => {
    const checkboxId = id || (label ? `checkbox-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    const handleClick = () => {
      if (!disabled && onChange) {
        onChange(!checked);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleClick();
      }
    };

    return (
      <label
        htmlFor={checkboxId}
        className={cn(
          "inline-flex items-center gap-2 cursor-pointer select-none",
          disabled && "cursor-not-allowed opacity-50",
          wrapperClassName
        )}
      >
        {/* Hidden native checkbox for accessibility */}
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
          aria-checked={checked}
          {...props}
        />

        {/* Custom styled checkbox */}
        <div
          role="presentation"
          tabIndex={disabled ? -1 : 0}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className={cn(
            "inline-flex items-center justify-center rounded border transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
            sizeClasses[size],
            checked
              ? "bg-primary border-primary shadow-sm"
              : "border-white/20 hover:border-white/40 bg-transparent"
          )}
        >
          {checked && (
            <Check
              className={cn(
                "text-white",
                checkIconSizes[size]
              )}
            />
          )}
        </div>

        {/* Label text */}
        {label && (
          <span className="text-sm font-medium text-white/90 peer-disabled:text-muted-foreground">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };