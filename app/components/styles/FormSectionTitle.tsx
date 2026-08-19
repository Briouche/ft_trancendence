type FormSectionTitleProps = {
  children: React.ReactNode;
  className?: string;
};

export default function FormSectionTitle({
  children,
  className = "",
}: FormSectionTitleProps) {
  return (
    <p className={`text-sm text-foreground/60 ${className}`}>{children}</p>
  );
}
