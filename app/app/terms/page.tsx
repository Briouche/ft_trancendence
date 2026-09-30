import type { Metadata } from "next";
import NoticePage from "@/components/NoticePage";
import { enTermsContent } from "@/config/english";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return <NoticePage data={enTermsContent} />;
}
