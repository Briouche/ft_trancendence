interface TextboxProps {
  name: string;
  label: string;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  required?: boolean;
  defaultValue?: string;
  error?: string;
}

export default function Textbox({
  name,
  label,
  type = "text",
  autoComplete,
  required = true,
  defaultValue,
  error,
}: TextboxProps) {
  const id = `field-${name}`;

  return (
    <div className="flex flex-col gap-1.5 text-left">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`rounded-xl border px-3 py-2.5 text-sm text-foreground bg-white transition focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
          error ? "border-danger" : "border-gray-300"
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
