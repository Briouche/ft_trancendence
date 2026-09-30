import type { Metadata } from "next";
import NoticePage from "@/components/NoticePage";
import { enPrivacyContent } from "@/config/english";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return <NoticePage data={enPrivacyContent} />;
}
