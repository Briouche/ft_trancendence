# `app/app/profile/EditProfileForm.tsx`

> Service : **app** · Client Component · modifier son profil

## 1. Rôle

Formulaire : nom, email, **mot de passe actuel** (si le compte en a un), nouveau mot de passe + confirmation. Validation zod côté client, puis server action `updateUserProfile`.

## 2. Dépendances

- **Importe** : `lib/updateUserProfile.ts`, `lib/validation.ts`, `NotebookUI`.

## 3. Explication bloc par bloc

`profileUpdateSchema.safeParse(formData)` → erreur affichée ou appel de l'action ; attributs HTML (`minLength`, `pattern`, `autoComplete`) tirés des mêmes constantes.

## 4. Flux concret

Changer de mot de passe → les autres sessions sont déconnectées.

## 5. Points d'attention

- Les règles affichées et vérifiées sont les mêmes des deux côtés.

## 6. Questions probables en évaluation

- **Faut-il son mot de passe actuel pour en changer ?** Oui.
