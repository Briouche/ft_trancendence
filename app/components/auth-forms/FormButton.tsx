//
//  FormButton.tsx
//
//
//  Created by François on 16/09/2026.
//

import BoxedButton from "@/components/notebook/BoxedButton";

interface FormButtonProps {
  pending?: boolean;
  pendingText?: string;
  children: React.ReactNode;
}

export default function FormButton({ pending, pendingText, children }: FormButtonProps) {
  return (
    <BoxedButton type="submit" disabled={pending} className="mt-2 h-11 w-full text-lg">
      {pending ? (pendingText ?? children) : children}
    </BoxedButton>
  );
}
