import React from "react";
import FormSectionTitle from "../styles/FormSectionTitle";

// Extends standard HTML input attributes so all props like maxLength, pattern, aria-*, etc., work natively.
export interface TextFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  className?: string;
}

export default function TextField({
  label,
  className = "",
  ...inputProps
}: TextFieldProps) {
  return (
    <label className="flex flex-col gap-1">
      <FormSectionTitle>{label}</FormSectionTitle>
      <input
        {...inputProps}
        className={`book-input w-72 px-4 py-2 text-ink-text placeholder:text-ink-muted/50 outline-none focus:ring-2 focus:ring-gold-500 ${className}`}
      />
    </label>
  );
}
