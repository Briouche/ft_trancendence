import { describe, expect, it } from "vitest";
import {
  deckBodySchema,
  emailSchema,
  loginSchema,
  messageContentSchema,
  passwordSchema,
  profileUpdateSchema,
  registerSchema,
  userSearchSchema,
  usernameSchema,
} from "@/lib/validation";

describe("usernameSchema", () => {
  it("trims and lower-cases valid usernames", () => {
    expect(usernameSchema.parse("  Alice_42 ")).toBe("alice_42");
  });

  it.each(["ab", "a".repeat(31), "bad name", "semi;colon", "<script>"])("rejects %j", (value) => {
    expect(usernameSchema.safeParse(value).success).toBe(false);
  });
});

describe("emailSchema", () => {
  it("normalises case and whitespace", () => {
    expect(emailSchema.parse("  Bob@Example.COM ")).toBe("bob@example.com");
  });

  it("rejects malformed addresses", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
    expect(emailSchema.safeParse(`${"a".repeat(250)}@x.io`).success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("requires lower, upper, digit and 8+ characters", () => {
    expect(passwordSchema.safeParse("Abcdefg1").success).toBe(true);
    expect(passwordSchema.safeParse("abcdefg1").success).toBe(false);
    expect(passwordSchema.safeParse("ABCDEFG1").success).toBe(false);
    expect(passwordSchema.safeParse("Abcdefgh").success).toBe(false);
    expect(passwordSchema.safeParse("Ab1").success).toBe(false);
    expect(passwordSchema.safeParse("Ab1" + "x".repeat(200)).success).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = { username: "alice", email: "a@b.io", password: "Abcdefg1", confirmPassword: "Abcdefg1" };

  it("accepts a valid form", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects mismatching confirmation", () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: "Abcdefg2" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Passwords do not match.");
  });
});

describe("loginSchema", () => {
  it("lower-cases the identifier so username and email lookups match stored values", () => {
    expect(loginSchema.parse({ identifier: " Alice@X.io ", password: "p" }).identifier).toBe("alice@x.io");
  });

  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ identifier: "alice", password: "" }).success).toBe(false);
  });
});

describe("profileUpdateSchema", () => {
  const base = { username: "alice", email: "a@b.io" };

  it("treats an empty password as 'keep the current one'", () => {
    expect(profileUpdateSchema.parse({ ...base, password: "" }).password).toBe("");
  });

  it("validates a new password and its confirmation", () => {
    expect(profileUpdateSchema.safeParse({ ...base, password: "weak", confirmPassword: "weak" }).success).toBe(false);
    expect(profileUpdateSchema.safeParse({ ...base, password: "Abcdefg1", confirmPassword: "nope" }).success).toBe(false);
    expect(profileUpdateSchema.safeParse({ ...base, password: "Abcdefg1", confirmPassword: "Abcdefg1" }).success).toBe(true);
  });
});

describe("deckBodySchema", () => {
  it("accepts a well-formed deck", () => {
    expect(deckBodySchema.safeParse({ name: "Aggro", cards: [{ cardId: "c1", qty: 2 }] }).success).toBe(true);
  });

  it.each([
    [{ name: "", cards: [{ cardId: "c1", qty: 1 }] }],
    [{ name: "x", cards: [] }],
    [{ name: "x", cards: [{ cardId: "c1", qty: 0 }] }],
    [{ name: "x", cards: [{ cardId: "c1", qty: 1.5 }] }],
    [{ name: "x", cards: "c1" }],
    [null],
  ])("rejects %j", (body) => {
    expect(deckBodySchema.safeParse(body).success).toBe(false);
  });
});

describe("messageContentSchema", () => {
  it("trims and bounds messages", () => {
    expect(messageContentSchema.parse("  hi  ")).toBe("hi");
    expect(messageContentSchema.safeParse("   ").success).toBe(false);
    expect(messageContentSchema.safeParse("x".repeat(501)).success).toBe(false);
  });
});

describe("userSearchSchema", () => {
  it("falls back to defaults on junk instead of failing", () => {
    expect(userSearchSchema.parse({ sort: "password", page: "-4", pageSize: "1000", filter: "admins" })).toEqual({
      q: "",
      sort: "elo",
      order: "desc",
      filter: "all",
      page: 1,
      pageSize: 10,
    });
  });

  it("keeps valid values and lower-cases the query", () => {
    expect(userSearchSchema.parse({ q: "BoB", sort: "username", order: "asc", page: "3", pageSize: "20", filter: "online" })).toEqual({
      q: "bob",
      sort: "username",
      order: "asc",
      filter: "online",
      page: 3,
      pageSize: 20,
    });
  });
});
