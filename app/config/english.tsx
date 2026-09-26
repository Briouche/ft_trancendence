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

// Legal pages. Keep them in line with what the code actually does: every data item, cookie and
// retention rule below maps to a real feature (see the comments on the matching lib/ files).
// TODO(team): replace [CONTACT EMAIL] with the team's contact address.

export const enPrivacyContent: NoticeData = {
  title: "Privacy Policy",
  lastUpdated: "September 2026",
  body: (
    <>
      <NoticeSection title="1. Who we are">
        <p>
          ft_transcendence is an online collectible card game built as a school project at 42.
          This policy explains which personal data the game stores, why, and for how long.
        </p>
      </NoticeSection>
      <NoticeSection title="2. Data we collect">
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li><strong>Account</strong>: username, email address and password. The password is only stored as an argon2id hash (salted); we never see or store it in clear.</li>
          <li><strong>Sign in with 42</strong>: your 42 user id, login and email address, received from the 42 intranet when you choose this option. No other 42 data is requested.</li>
          <li><strong>Avatar</strong>: the image you upload (PNG, JPEG or WebP, up to 2 MB), if any.</li>
          <li><strong>Game data</strong>: your card collection, decks, unopened packs, card backs, match history (date, mode, opponent, result, Elo change), win counters, Elo rating and achievements.</li>
          <li><strong>Social data</strong>: your friends and pending friend requests, and the chat messages you exchange with friends.</li>
          <li><strong>Presence</strong>: whether you are currently online or in a match, kept in memory only while you are connected.</li>
          <li><strong>Technical data</strong>: your IP address, used for a short time to limit repeated failed login attempts and recorded in the web server&apos;s access logs.</li>
        </ul>
      </NoticeSection>
      <NoticeSection title="3. How we use it">
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>To create your account and sign you in (email/username and password, or 42).</li>
          <li>To run the game: build your decks, match you with opponents, record results, rewards and rankings.</li>
          <li>To show other players your public profile: username, avatar, presence, Elo, statistics, badges and recent matches. Your email address is never shown to other players.</li>
          <li>To deliver chat messages to the friend you send them to.</li>
          <li>To protect the service: rate limiting, session revocation after a password change.</li>
        </ul>
      </NoticeSection>
      <NoticeSection title="4. Cookies">
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li><strong>session</strong> — keeps you signed in for 7 days. HttpOnly, Secure, SameSite=Lax. Strictly necessary.</li>
          <li><strong>ft_oauth_state</strong>, <strong>ft_oauth_link</strong> — protect the &quot;Sign in with 42&quot; flow against forgery, deleted after 5 minutes at most. Strictly necessary.</li>
        </ul>
        <p>We use no advertising, analytics or third-party tracking cookies.</p>
      </NoticeSection>
      <NoticeSection title="5. Sharing">
        <p>We do not sell or share your personal data. The only third party involved is the 42 intranet, and only if you use &quot;Sign in with 42&quot;, under its own privacy policy.</p>
      </NoticeSection>
      <NoticeSection title="6. Security">
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>Every connection to the service, including real-time game and chat connections, is encrypted with HTTPS/WSS.</li>
          <li>Passwords are hashed with argon2id; sessions are signed tokens that are revoked when you change your password.</li>
          <li>Uploaded avatars are checked and stored under random names, and are only ever served as images.</li>
        </ul>
      </NoticeSection>
      <NoticeSection title="7. Retention">
        <p>
          Account, game and chat data are kept while your account exists. Presence disappears when
          you disconnect. Rate-limiting counters expire after at most one hour.
        </p>
      </NoticeSection>
      <NoticeSection title="8. Your rights">
        <p>
          You can view and correct your username, email, password and avatar at any time from your
          profile page. You can ask for a copy or the deletion of your data by contacting us; on
          deletion, your messages, friendships, matches and achievements are removed with your account.
        </p>
      </NoticeSection>
      <NoticeSection title="9. Contact">
        <p>For any question about this policy or your data: [CONTACT EMAIL]</p>
      </NoticeSection>
    </>
  ),
};

export const enTermsContent: NoticeData = {
  title: "Terms of Service",
  lastUpdated: "September 2026",
  body: (
    <>
      <NoticeSection title="1. The service">
        <p>
          ft_transcendence is a free online collectible card game made as a school project at 42.
          It is provided &quot;as is&quot;, without any guarantee of availability or fitness for a
          particular purpose.
        </p>
      </NoticeSection>
      <NoticeSection title="2. Your account">
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>Register with a valid email address, or with your 42 account.</li>
          <li>Keep your password secret; you are responsible for what happens under your account.</li>
          <li>One person, one account: do not create accounts to farm rewards or Elo.</li>
        </ul>
      </NoticeSection>
      <NoticeSection title="3. Fair play">
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>Do not cheat, exploit bugs, automate play or tamper with the game client or server.</li>
          <li>Leaving a match counts as a forfeit if you do not come back within 30 seconds.</li>
          <li>Rewards (packs, card backs, achievements) and rankings may be corrected if obtained unfairly.</li>
        </ul>
      </NoticeSection>
      <NoticeSection title="4. Chat and content">
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>Chat is only possible between friends. Be respectful: no harassment, hate, spam or illegal content.</li>
          <li>You keep the rights to the avatar you upload and let us display it inside the game. Only upload images you have the right to use, and nothing offensive or illegal.</li>
          <li>You are responsible for the messages and images you send.</li>
        </ul>
      </NoticeSection>
      <NoticeSection title="5. Sign in with 42">
        <p>Using your 42 account is also governed by the 42 intranet&apos;s own terms and privacy policy.</p>
      </NoticeSection>
      <NoticeSection title="6. Suspension">
        <p>Accounts that break these terms may be suspended or deleted.</p>
      </NoticeSection>
      <NoticeSection title="7. Changes">
        <p>These terms may change; the date above shows the latest version. Continuing to play means you accept it.</p>
      </NoticeSection>
      <NoticeSection title="8. Contact">
        <p>For any question about these terms: [CONTACT EMAIL]</p>
      </NoticeSection>
    </>
  ),
};
