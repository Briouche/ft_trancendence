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
        className={`w-72 rounded-btn bg-white/80 px-4 py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-accent ${className}`}
      />
    </label>
  );
}
