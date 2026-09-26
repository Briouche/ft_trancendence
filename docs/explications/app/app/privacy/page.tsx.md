# `app/app/privacy/page.tsx`

> Service : **app** · Server Component · ~7 lignes · `/privacy`.

## 1. Rôle

Politique de confidentialité, affichée par `NoticePage` avec le contenu `enPrivacyContent`
(`config/english.tsx`). Accessible sans être connecté, depuis le pied de page de toutes les pages.

## 2. Dépendances

- **Importe** : `components/NoticePage`, `config/english.tsx`.

## 3. Explication bloc par bloc

Un seul composant rendu.

## 4. Flux concret

Pied de page « Privacy Policy » → cette page.

## 5. Points d'attention

- Le contenu reflète ce que l'application stocke réellement : à mettre à jour si une donnée
  nouvelle est collectée.

## 6. Questions probables en évaluation

- **Quelles données collectez-vous ?** Voir la page : compte, 42, avatar, jeu, amis, chat,
  présence, IP (limite de débit).
