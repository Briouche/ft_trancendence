// Paths of the app's pages, so links don't hard-code them.
export const ROUTES = {
  home: "/",
  register: "/register",
  profile: "/profile",
  // Another user's (read-only) profile — /profile itself always means "mine, editable".
  // Keyed by username (not id) so the URL doesn't expose/enumerate sequential user ids.
  profileOf: (username: string) => `/profile/${username}`,
  friends: "/friends",
  chatWith: (id: number) => `/chat/${id}`,
  privacyNotice: "/privacy",
  termsOfUse: "/terms",
  profile: "/profile",
  friends: "/friends",
}
