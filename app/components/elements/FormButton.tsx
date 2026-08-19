type FormButtonProps = {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

export default function FormButton({
  children,
  className = "",
  disabled = false,
}: FormButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={`w-72 rounded-btn bg-accent px-4 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}
