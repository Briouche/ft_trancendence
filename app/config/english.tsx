export const english = {
  // home page
  appName: "ft_transcendence",
  copyright: "ft_transcendence. All rights reserved.",
  privacyPolicy: "Privacy Policy",
  termsOfService: "Terms of Service",

  // notice page
  lastUpdated: "Last Updated"
}

import { NoticeData } from "@/components/NoticePage";
import { NoticeSection } from "@/components/styles/NoticeSection";

export const enPrivacyContent: NoticeData = {
  title: "Privacy Policy",
  lastUpdated: "August 2026",
  body: (
    <>
      <NoticeSection title="1. Information We Collect">
        <p>We collect information you provide directly to us...</p>
      </NoticeSection>
      <NoticeSection title="2. How We Use Information">
        <p>
          We use the information to provide our services...
          I will write a very long text to see how the scrollable content works.
          This is another very long line just for the sake of long lines.
          bla-bla-bla there is no content in this line but some characters anyways.
        </p>
      </NoticeSection>
      <NoticeSection title="2. How We Use Information">
        <p>
          We use the information to provide our services...
          I will write a very long text to see how the scrollable content works.
          This is another very long line just for the sake of long lines.
          bla-bla-bla there is no content in this line but some characters anyways.
        </p>
      </NoticeSection>
      <NoticeSection title="2. How We Use Information">
        <p>
          We use the information to provide our services...
          I will write a very long text to see how the scrollable content works.
          This is another very long line just for the sake of long lines.
          bla-bla-bla there is no content in this line but some characters anyways.
        </p>
      </NoticeSection>
      <NoticeSection title="2. How We Use Information">
        <p>
          We use the information to provide our services...
          I will write a very long text to see how the scrollable content works.
          This is another very long line just for the sake of long lines.
          bla-bla-bla there is no content in this line but some characters anyways.
        </p>
      </NoticeSection>
      <NoticeSection title="2. How We Use Information">
        <p>
          We use the information to provide our services...
          I will write a very long text to see how the scrollable content works.
          This is another very long line just for the sake of long lines.
          bla-bla-bla there is nocontent in this line but some characters anyways.
        </p>
      </NoticeSection>
    </>
  ),
};

export const enTermsContent: NoticeData = {
  title: "Terms of Service",
  lastUpdated: "August 2026",
  body: (
    <>
      <NoticeSection title="1. Acceptance of Terms">
        <p>By accessing our app, you agree to these terms...</p>
      </NoticeSection>
    </>
  ),
};
