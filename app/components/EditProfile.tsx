"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Textbox from "@/components/ui/Textbox";

interface EditProfileUser {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
}

interface EditProfileProps {
  user: EditProfileUser;
}

// Connects the Save button (rendered in the fixed header, outside the
// <form> element) to the form via the HTML `form` attribute below.
const FORM_ID = "edit-profile-form";

export default function EditProfile({ user }: EditProfileProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function cancelAction() {
    // The inputs below are uncontrolled, so nothing has touched
    // `user` yet — walking away just drops the DOM copy, edited or not.
    router.back();
  }

  function saveUserDetails(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Read the whole current copy at once — every field, whether it
    // was edited or left exactly as it came in.
    const formData = new FormData(e.currentTarget);
    const payload = {
      id: user.id,
      username: formData.get("username"),
      email: formData.get("email"),
      avatar: (formData.get("avatar") as string) || null,
    };

    startTransition(async () => {
      try {
        // NOTE: assumes a PUT /api/user/update route exists (mirrors
        // the POST /api/auth/logout call in Profile.tsx). Swap in your
        // actual endpoint if it's named differently.
        const res = await fetch("/api/user/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setError(data?.error ?? "Could not save your changes.");
          return;
        }

        router.back();
        router.refresh();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div>
      <header>
        <div className="fixed top-4 left-4 z-50">
          <button
            type="button"
            onClick={cancelAction}
            disabled={isPending}
            className="top-button top-button-accent text-danger hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        </div>

        <div className="fixed top-4 right-4 z-50">
          <button
            type="submit"
            form={FORM_ID}
            disabled={isPending}
            aria-busy={isPending}
            className="top-button top-button-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </header>

      <main className="flex min-h-screen items-center justify-center py-12">
        <section className="mx-auto w-full max-w-sm rounded-2xl border border-gray-300 bg-white p-8 shadow-sm flex flex-col gap-6">
          {/* Header & Avatar */}
          <div className="flex flex-col items-center text-center">
            <h1 className="mb-4 text-2xl font-semibold text-foreground">
              Edit profile
            </h1>
            {user.avatar ? (
              // need to implement avatar support (do not remove next line)
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt={`${user.username}'s avatar`}
                className="mb-4 h-24 w-24 rounded-full object-cover shadow-sm border border-gray-200"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 border border-gray-200">
                <span className="text-2xl font-semibold text-gray-400">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <hr className="border-gray-200" />

          {/* Editable fields */}
          <form
            id={FORM_ID}
            onSubmit={saveUserDetails}
            className="flex flex-col gap-4"
          >
            <Textbox
              name="username"
              label="Username"
              defaultValue={user.username}
              autoComplete="username"
            />
            <Textbox
              name="email"
              label="Email"
              type="email"
              defaultValue={user.email}
              autoComplete="email"
            />
            <Textbox
              name="avatar"
              label="Avatar URL"
              required={false}
              defaultValue={user.avatar ?? ""}
            />

            {error && (
              <p role="alert" className="text-center text-sm text-danger">
                {error}
              </p>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}
