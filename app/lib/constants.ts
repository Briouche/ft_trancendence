import "server-only";

// Password hashing parameters (server only). Input validation rules live in lib/validation.ts.

/** argon2id parameters: the OWASP minimum recommendation (19 MiB, 2 iterations, 1 lane). */
export const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

// Verified against when the user doesn't exist, so a failed login takes as long for an unknown
// username as for a wrong password (no account enumeration by timing).
export const DUMMY_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$c29tZXJhbmRvbXNhbHQ$2rXwn8YSrN3W5uJmYh1IhrJfw5PZqPFqUJvXWkG1SVI";
