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
  lastUpdated: "September 2026",
  body: (
    <>
      <NoticeSection title="1. Data We Collect">
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li><strong>Account data</strong>: email address and password (stored hashed and salted).</li>
          <li><strong>OAuth data</strong>: if you sign in via 42, we receive your name, email address, and profile picture from that provider.</li>
          <li><strong>Profile data</strong>: your username and any avatar/profile picture you upload.</li>
          <li><strong>Gameplay data</strong>: your decks, card collection, and in-game statistics.</li>
          <li><strong>Chat data</strong>: messages you send to other users through the in-app chat.</li>
        </ul>
      </NoticeSection>
      <NoticeSection title="2. How We Use Your Data">
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>To create and manage your account.</li>
          <li>To authenticate you via email/password or OAuth.</li>
          <li>To generate your in-game hero from your profile picture and username.</li>
          <li>To display your profile, and friends list.</li>
          <li>To deliver chat messages between users.</li>
        </ul>
      </NoticeSection>
      <NoticeSection title="3. Data Sharing">
        <p>We do not sell or share your personal data with third parties, except:</p>
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>The OAuth provider you choose to authenticate with (42), which processes your login under its own privacy policy.</li>
          <li>As required by law.</li>
        </ul>
      </NoticeSection>
      <NoticeSection title="4. Data Storage & Security">
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>Passwords are hashed and salted before storage; we never store plaintext passwords.</li>
          <li>All data is stored in our application database and is not shared outside the Service.</li>
          <li>All connections to our backend use HTTPS.</li>
        </ul>
      </NoticeSection>
      <NoticeSection title="5. Data Retention">
        <p>
          We retain your account, profile, and gameplay data for as long as your account is active.
          You may request deletion of your account and associated data by contacting us.
        </p>
      </NoticeSection>
      <NoticeSection title="6. Chat Content">
        <p>
          Chat messages are stored to provide chat history within the app and may be visible to
          the recipient(s) of the conversation.
        </p>
      </NoticeSection>
      <NoticeSection title="7. Contact">
        <p>
          For any questions about this Privacy Policy or your data, contact: [CONTACT EMAIL]
        </p>
      </NoticeSection>
    </>
  ),
};

export const enTermsContent: NoticeData = {
  title: "Terms of Service",
  lastUpdated: "September 2026",
  body: (
    <>
      <NoticeSection title="1. Eligibility & Account">
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>You must provide accurate information when creating an account (email and password, or via OAuth).</li>
          <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
          <li>You are responsible for all activity that occurs under your account.</li>
        </ul>
      </NoticeSection>
      <NoticeSection title="2. Acceptable Use">
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>Use the Service for any unlawful purpose.</li>
          <li>Harass, abuse, or send offensive content to other users via chat.</li>
          <li>Attempt to cheat, exploit bugs, or interfere with the game&apos;s AI, matchmaking, or other players&apos; sessions.</li>
          <li>Upload avatars or content that is offensive, infringing, or illegal.</li>
        </ul>
      </NoticeSection>
      <NoticeSection title="3. User Content">
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>You retain ownership of any avatar or profile picture you upload, but grant us a license to display it within the Service (including generating your in-game hero from it).</li>
          <li>Chat messages you send remain your responsibility; we are not liable for content sent between users.</li>
        </ul>
      </NoticeSection>
      <NoticeSection title="4. Third-Party Authentication">
        <p>
          If you sign in via 42, your use of that service is governed by its own terms and
          privacy policy, in addition to ours.
        </p>
      </NoticeSection>
      <NoticeSection title="5. Availability">
        <p>
          The Service is provided as an academic/school project and is offered &quot;as is&quot;,
          without warranty of any kind, including availability, uptime, or fitness for a
          particular purpose.
        </p>
      </NoticeSection>
      <NoticeSection title="6. Termination">
        <p>
          We reserve the right to suspend or terminate accounts that violate these Terms,
          including abusive chat behavior or attempts to exploit the Service.
        </p>
      </NoticeSection>
      <NoticeSection title="7. Changes to These Terms">
        <p>
          We may update these Terms from time to time. Continued use of the Service after
          changes constitutes acceptance of the updated Terms.
        </p>
      </NoticeSection>
      <NoticeSection title="8. Contact">
        <p>
          For any questions about these Terms, contact: [CONTACT EMAIL]
        </p>
      </NoticeSection>
    </>
  ),
};
