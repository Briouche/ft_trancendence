"use client";

import { useActionState } from "react";

export interface FormState {
  error?: string;
}

interface FormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export default function Form({
  action,
  title,
  subtitle,
  footer,
  children,
}: FormProps) {
  const [state, formAction] = useActionState(action, {});

  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-gray-300 bg-white p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-secondary">{subtitle}</p>}
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        {children}

        {state.error && (
          <p role="alert" className="text-center text-sm text-danger">
            {state.error}
          </p>
        )}
      </form>

      {footer && (
        <div className="mt-6 text-center text-sm text-secondary">{footer}</div>
      )}
    </div>
  );
}
