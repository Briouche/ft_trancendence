# `app/config/english.tsx`

> Service : **app** · TypeScript (JSX) · textes et pages légales

## 1. Rôle

Quelques textes d'interface (`english`) et le **contenu complet** de la Privacy Policy et des Terms of Service (`enPrivacyContent`, `enTermsContent`), écrits d'après ce que l'application fait réellement (données, cookies, sécurité, conservation, droits, fair-play).

## 2. Dépendances

- **Importe** : `components/NoticePage` (type), `components/styles/NoticeSection`.
- **Utilisé par** : `app/privacy`, `app/terms`, `Footer`, `Header`, `AccountMenu`.

## 3. Explication bloc par bloc

Contenu en JSX (listes, sections).

## 4. Flux concret

Pied de page → Privacy Policy.

## 5. Points d'attention

- `[CONTACT EMAIL]` : `TODO(team)`.
- Toute nouvelle donnée collectée doit y être ajoutée.

## 6. Questions probables en évaluation

- **Vos pages légales ont-elles un vrai contenu ?** Oui, spécifique au projet.
