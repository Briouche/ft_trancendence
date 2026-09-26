# `app/components/RegisterForm.tsx`

> Service : **app** · Client Component · formulaire d'inscription

## 1. Rôle

Nom, email, mot de passe, confirmation ; validation par `registerSchema` (zod) avant d'appeler la server action `registerUser` ; redirection vers l'accueil en cas de succès.

## 2. Dépendances

- **Importe** : `lib/auth.ts`, `lib/validation.ts`, `config/routes.ts`, `NotebookUI`, `ScaleToFit`.

## 3. Explication bloc par bloc

Attributs HTML (`minLength`, `maxLength`, `pattern`, `autoComplete`) tirés des constantes de `validation.ts` ; message d'erreur dans un `role="alert"`.

## 4. Flux concret

Mot de passe sans majuscule → message immédiat, aucun appel serveur.

## 5. Points d'attention

- Le serveur refait la même validation.

## 6. Questions probables en évaluation

- **Validez-vous le formulaire d'inscription des deux côtés ?** Oui, même schéma zod.
