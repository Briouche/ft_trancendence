# `app/components/ScaleToFit.tsx`

> Service : **app** · Client Component · mise à l'échelle

## 1. Rôle

Rend un contenu de taille fixe puis le **réduit ou l'agrandit d'un bloc** pour tenir dans l'espace disponible (jusqu'à `maxScale`). Utilisé par les pages « livre » à mise en page pixel exacte.

## 2. Dépendances

- **Utilisé par** : collection, constructeur, paquets, jeu, manuel, connexion/inscription.

## 3. Explication bloc par bloc

Deux `ResizeObserver` (contenu et conteneur) → `scale = min(maxScale, largeur dispo / largeur, hauteur dispo / hauteur)` ; déconnectés au démontage.

## 4. Flux concret

Sur une petite fenêtre, le carnet de collection est réduit mais reste entier.

## 5. Points d'attention

- Sur téléphone en portrait, le contenu devient petit (limite connue) ; les pages de listes utilisent plutôt `PageShell`.

## 6. Questions probables en évaluation

- **Comment ces pages s'adaptent-elles à l'écran ?** Mise à l'échelle globale.
