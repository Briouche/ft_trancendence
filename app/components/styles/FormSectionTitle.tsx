type FormSectionTitleProps = {
  children: React.ReactNode;
  className?: string;
};

export default function FormSectionTitle({
  children,
  className = "",
}: FormSectionTitleProps) {
  return (
    <p className={`font-pixel text-base text-ink-muted ${className}`}>{children}</p>
  );
}
