interface FormTextFieldProps {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternTitle?: string;
}

export default function FormTextField({
  label,
  name,
  type = "text",
  autoComplete,
  placeholder = "...",
  required,
  minLength,
  maxLength,
  pattern,
  patternTitle,
}: FormTextFieldProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-left font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">
        {label}
      </span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        pattern={pattern}
        title={patternTitle}
        className="travelbook-slot w-full bg-transparent py-2 pl-4 pr-3 font-serif
          text-base text-ink-text placeholder:text-ink-muted/60 outline-none"
      />
    </label>
  );
}
