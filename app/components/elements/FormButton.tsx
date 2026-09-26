type FormButtonProps = {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

/** Submit button of the small server-action forms (log out). */
export default function FormButton({
  children,
  className = "",
  disabled = false,
}: FormButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={`w-72 rounded-btn border border-gold-500/50 bg-leather-800 px-4 py-2 font-pixel text-lg text-gold-300 transition-colors hover:bg-leather-700 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}
