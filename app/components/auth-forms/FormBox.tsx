import Link from "next/link";
import { ROUTES } from "@/config/routes";

import { outlinedWhiteTextStyle } from "@/components/notebook/NotebookUI";
import ScaleToFit from "@/components/ScaleToFit";

interface BottomFormBoxProps {
  bottomText: string;
  bottomRoute: string;
  bottomRouteText: string;
}

interface FormBoxProps extends BottomFormBoxProps {
  title: string;
  children?: React.ReactNode;
  action: (formData: FormData) => void | Promise<void>;
  error: string;
}

export default function FormBox({
  title,
  children,
  action,
  error,
  bottomText,
  bottomRoute,
  bottomRouteText,
}: FormBoxProps) {
  return (
    <ScaleToFit className="flex-1">
      <div className="travelbook-frame4-panel flex w-84 flex-col p-7 text-center">
        <h2
          className="font-display text-5xl font-medium text-white"
          style={outlinedWhiteTextStyle}
        >
          {title}

        </h2>

        <form action={action} className="mt-5 flex flex-col gap-3">
          {error && (
            <p role="alert" className="text-center text-sm text-red-500">
              {error}
            </p>
          )}

          {children}
        </form>

        <p className="mt-5 font-serif text-base text-ink-muted">
          {bottomText}

          <Link
            href={bottomRoute}
            className="ml-1 font-medium text-ink-text hover:underline"
          >
            {bottomRouteText}
          </Link>
        </p>
      </div>
    </ScaleToFit>
  );
}
