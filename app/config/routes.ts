// Paths of the app's pages, so links don't hard-code them.
export const ROUTES = {
  home: "/",
  register: "/register",
  privacyNotice: "/privacy",
  termsOfUse: "/terms",
  profile: "/profile",
  friends: "/friends",
  chat: "/chat",
  players: "/players",
  achievements: "/achievements",
  designSystem: "/design-system",
  /** Public profile of a player. */
  user: (username: string) => `/users/${encodeURIComponent(username)}`,
};
