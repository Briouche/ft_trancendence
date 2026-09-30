import { NoticeData } from "@/components/NoticePage";
import { NoticeSection } from "@/components/styles/NoticeSection";

// UI copy and legal page content (English).

export const english = {
  appName: "ft_transcendence",
  privacyPolicy: "Privacy Policy",
  termsOfService: "Terms of Service",
};

// Legal pages. Keep them in step with what the app really stores and does: they describe the
// data model (app/prisma/schema.prisma), the cookies (lib/auth) and the realtime services.
// TODO(team): replace the contact placeholder with the team's address before any deployment.
const CONTACT = "[TODO(team): contact e-mail]";

export const enPrivacyContent: NoticeData = {
  title: "Privacy Policy",
  lastUpdated: "30 September 2026",
  body: (
    <>
      <NoticeSection title="1. Who we are">
        <p>
          ft_transcendence is a collectible card game built as a student project of the 42 curriculum.
          This policy explains what personal data the game stores, why, and what you can do about it.
        </p>
      </NoticeSection>
      <NoticeSection title="2. Data we collect">
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li><strong>Account</strong>: your username, e-mail address and password. The password is never stored: we keep an Argon2id hash (salted) of it.</li>
          <li><strong>Sign in with 42</strong>: if you use it, 42 sends us your 42 user id, login and e-mail address. We store the id to recognise you next time; we never receive your 42 password.</li>
          <li><strong>Profile</strong>: the avatar image you upload (checked to be a PNG, JPEG, WebP or GIF of at most 512 KB), your join date.</li>
          <li><strong>Game data</strong>: your card collection, decks, unopened packs, win counts per opponent type, Elo rating, and unlocked card backs.</li>
          <li><strong>Social data</strong>: your friend requests and friendships, and the chat messages you exchange with friends.</li>
          <li><strong>Presence</strong>: whether you are currently connected or in a match. It is kept in memory (Redis) only while you are connected and is not archived.</li>
          <li><strong>Technical data</strong>: your IP address is used in memory to limit repeated failed sign-ins; it is not stored in the database.</li>
        </ul>
      </NoticeSection>
      <NoticeSection title="3. Why we use it">
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>To create your account, sign you in and keep you signed in.</li>
          <li>To run matches, keep your collection and decks, and compute your rating and rewards.</li>
          <li>To show your public profile (username, avatar, wins, badges, online status) to other players, and the leaderboard.</li>
          <li>To deliver chat messages and friend requests.</li>
          <li>To protect accounts against password guessing.</li>
        </ul>
      </NoticeSection>
      <NoticeSection title="4. Cookies">
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li><strong>session</strong>: keeps you signed in for 7 days (HttpOnly, SameSite=Lax). Signing out deletes it.</li>
          <li><strong>ft_oauth_state</strong>, <strong>ft_oauth_link</strong>: only during a &quot;Sign in with 42&quot; attempt, for at most 5 minutes, to protect it against forgery.</li>
        </ul>
        <p>We use no advertising, analytics or tracking cookies.</p>
      </NoticeSection>
      <NoticeSection title="5. Who can see it">
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>Other players see your public profile, badges and online status. Your e-mail address is only shown to you.</li>
          <li>Chat messages are visible only to you and the friend you write to.</li>
          <li>We do not sell or share your data. 42 processes your sign-in under its own privacy policy if you choose to use it.</li>
        </ul>
      </NoticeSection>
      <NoticeSection title="6. Security">
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>Passwords are hashed with Argon2id; sessions are signed tokens that can be revoked.</li>
          <li>The production deployment is served over HTTPS only, including the game and chat connections.</li>
          <li>Every input is validated by the server, and each player can only act on their own account, decks and messages.</li>
        </ul>
      </NoticeSection>
      <NoticeSection title="7. Retention and your rights">
        <p>
          Your data is kept while your account exists. You can change your username, e-mail, password and avatar
          from your profile at any time. To get a copy of your data or have your account and all associated data
          deleted (collection, decks, friendships, messages), contact us at {CONTACT}.
        </p>
      </NoticeSection>
    </>
  ),
};

export const enTermsContent: NoticeData = {
  title: "Terms of Service",
  lastUpdated: "30 September 2026",
  body: (
    <>
      <NoticeSection title="1. The service">
        <p>
          ft_transcendence is a free online collectible card game made as a 42 student project. It is provided
          &quot;as is&quot;, without any guarantee of availability, and your progress may be reset during development.
        </p>
      </NoticeSection>
      <NoticeSection title="2. Your account">
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>Provide a valid e-mail address and keep your password to yourself; you are responsible for what is done with your account.</li>
          <li>One account per person. Usernames must not impersonate someone else or be offensive.</li>
          <li>If you sign in with 42, the 42 terms also apply to that sign-in.</li>
        </ul>
      </NoticeSection>
      <NoticeSection title="3. Fair play">
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>Do not cheat: no modified clients, scripted play, or exploitation of bugs to win matches or obtain cards.</li>
          <li>Leaving a match, or staying disconnected for more than 30 seconds, counts as a forfeit.</li>
          <li>Do not try to access other players&apos; accounts or disrupt the servers.</li>
        </ul>
      </NoticeSection>
      <NoticeSection title="4. Behaviour and content">
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>Be respectful in chat: no harassment, hate speech, spam or illegal content.</li>
          <li>Upload only avatars you have the right to use and that are not offensive. You keep your rights on them and let us display them to other players.</li>
        </ul>
      </NoticeSection>
      <NoticeSection title="5. Virtual items">
        <p>
          Cards, packs, card backs, and ratings have no monetary value, cannot be bought or sold, and
          may be rebalanced or reset.
        </p>
      </NoticeSection>
      <NoticeSection title="6. Suspension">
        <p>
          Accounts breaking these terms may be suspended or deleted. You can ask for your own account to be deleted
          at any time (see the Privacy Policy).
        </p>
      </NoticeSection>
      <NoticeSection title="7. Changes and contact">
        <p>
          These terms may change; the date above shows the last update. Questions: {CONTACT}.
        </p>
      </NoticeSection>
    </>
  ),
};
