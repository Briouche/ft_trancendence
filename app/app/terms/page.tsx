import NoticePage from "@/components/NoticePage";
import { enTermsContent } from "@/config/english";

/** /terms — Terms of Service (content in config/english.tsx). */
export default function TermsPage() {
  return <NoticePage data={enTermsContent} />;
}
