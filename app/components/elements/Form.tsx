import RoundedRectangle from "./RoundedRectangle";

type FormProps = {
  action?: string | ((formData: FormData) => void | Promise<void>);
  onSubmit?: (e: React.SubmitEvent) => void;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export default function Form({
  action,
  onSubmit,
  title,
  subtitle,
  footer,
  children,
  className = "",
}: FormProps) {
  return (
    <RoundedRectangle className={`py-2 ${className}`}>
      <h2 className="text-center font-pixel text-6xl">{title}</h2>
      {subtitle && (
        <p className="text-center font-pixel text-sm text-ink-muted mt-1">
          {subtitle}
        </p>
      )}

      <form
        action={action}
        onSubmit={onSubmit}
        method={typeof action === "string" ? "POST" : undefined}
        className="flex flex-col gap-2 mt-4"
      >
        {children}
      </form>

      {footer && (
        <p className="text-center font-pixel text-sm text-ink-muted mt-4">
          {footer}
        </p>
      )}
    </RoundedRectangle>
  );
}
