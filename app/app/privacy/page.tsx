import NoticePage from "@/components/NoticePage";
import { enPrivacyContent } from "@/config/english";

/** /privacy — Privacy Policy (content in config/english.tsx). */
export default function PrivacyPage() {
  return <NoticePage data={enPrivacyContent} />;
}
