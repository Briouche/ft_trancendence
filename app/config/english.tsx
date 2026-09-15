import { NoticeData } from "@/components/NoticePage";
import { NoticeSection } from "@/components/styles/NoticeSection";

// UI copy and legal page content (English).

export const english = {
  appName: "ft_transcendence",
  copyright: "ft_transcendence. All rights reserved.",
  privacyPolicy: "Privacy Policy",
  termsOfService: "Terms of Service",

  lastUpdated: "Last Updated",

  profile: "Profile",
  friends: "Friends",
  editProfile: "Edit profile",
  save: "Save",
  cancel: "Cancel",
  back: "Back",
  addFriend: "Add a friend",
}

export const enPrivacyContent: NoticeData = {
  title: "Privacy Policy",
  lastUpdated: "August 2026",
  body: (
    <>
      <NoticeSection title="1. Information We Collect">
        <p>We collect information you provide directly to us...</p>
      </NoticeSection>
      <NoticeSection title="2. How We Use Information">
        <p>We use the information to provide our services...</p>
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
