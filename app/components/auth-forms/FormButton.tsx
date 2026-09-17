//
//  FormButton.tsx
//
//
//  Created by François on 16/09/2026.
//

interface FormButtonProps {
  pending?: boolean;
  pendingText?: string;
  children: React.ReactNode;
}

export default function FormButton({ pending, pendingText, children }: FormButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="travelbook-slot03a mt-2 h-11 w-full font-display text-lg font-bold text-white
        transition-transform active:scale-95 disabled:opacity-30"
    >
      {pending ? (pendingText ?? children) : children}
    </button>
  );
}
