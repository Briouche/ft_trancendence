# `app/lib/updateUserProfile.ts`

> Service : **app** · Server Action · ~90 lignes · modification du profil.

## 1. Rôle

Met à jour le nom d'utilisateur, l'email et, optionnellement, le mot de passe du compte connecté.

## 2. Dépendances

- **Importe** : `next/cache` (`revalidatePath`), `@node-rs/argon2`, `@prisma/client`,
  `lib/prisma.ts`, `lib/session.ts`, `lib/constants.ts`, `lib/validation.ts`.
- **Utilisé par** : `app/profile/EditProfileForm.tsx`.

## 3. Explication bloc par bloc

1. Session obligatoire.
2. `profileUpdateSchema` (zod) ; un mot de passe vide = inchangé.
3. Nouveau mot de passe : si le compte en a déjà un, l'**actuel est exigé** et vérifié (un compte
   42 seul n'en a pas et peut en définir un).
4. `user.update` ; si le mot de passe change, `tokenVersion: { increment: 1 }` → **toutes les
   autres sessions sont révoquées** ; puis `createSession` en réémet une pour ce navigateur.
5. Doublon (P2002) : `describeConflict` relit la base pour dire si c'est l'email ou le nom qui est
   pris (l'adaptateur `pg` ne précise pas toujours la contrainte).
6. `revalidatePath("/profile")` : la page affiche les nouvelles valeurs.

## 4. Flux concret

Alice change son mot de passe sur son PC : son téléphone, connecté, est déconnecté à la requête
suivante (son JWT a l'ancien `tokenVersion`).

## 5. Points d'attention

- Sans l'exigence du mot de passe actuel, une session volée suffirait à s'approprier le compte.

## 6. Questions probables en évaluation

- **Que se passe-t-il pour les autres sessions après un changement de mot de passe ?** Révoquées
  (`tokenVersion`).
