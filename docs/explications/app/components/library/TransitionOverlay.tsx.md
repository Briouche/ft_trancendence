# `app/components/library/TransitionOverlay.tsx`

> Service : **app** · Client Component · fondu entre les pages

## 1. Rôle

Voile noir qui disparaît en fondu à chaque changement de page.

## 2. Dépendances

- **Importe** : `next/navigation` (`usePathname`).
- **Utilisé par** : `app/layout.tsx`.

## 3. Explication bloc par bloc

Nouvelle route détectée **pendant le rendu** (méthode recommandée par React pour réinitialiser un état), voile remis, puis retiré 30 ms plus tard dans un effet (minuteur annulé au démontage).

## 4. Flux concret

Clic sur « Collection » → fondu depuis le noir.

## 5. Points d'attention

- `pointer-events-none` : n'empêche jamais de cliquer.

## 6. Questions probables en évaluation

- Aucune spécifique.
