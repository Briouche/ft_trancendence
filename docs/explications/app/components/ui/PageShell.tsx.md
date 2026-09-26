# `app/components/ui/PageShell.tsx`

> Service : **app** · Client Component · mise en page des pages de listes

## 1. Rôle

Fond « table en bois », bouton retour au hub, bannière de titre, et colonne centrée qui **se réorganise** sur petit écran (au lieu d'être réduite comme les pages « livre »).

## 2. Dépendances

- **Importe** : `next/navigation`, `NotebookUI` (`HomeButton`, `woodenTableBackground`).
- **Utilisé par** : amis, chat, joueurs, profils, succès, vitrine.
- **Design system** : composant listé dans `docs/DESIGN_SYSTEM.md`, visible sur `/design-system`.

## 3. Explication bloc par bloc

`<main>` avec `max-w-5xl`, marges de 16 px sur mobile, espace en bas pour le pied de page.

## 4. Flux concret

Sur téléphone, `/players` affiche les filtres les uns sous les autres.

## 5. Points d'attention

- Un seul `<h1>` par page (le titre).

## 6. Questions probables en évaluation

- Aucune spécifique.
