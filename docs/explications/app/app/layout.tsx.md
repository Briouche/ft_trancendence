# `app/app/layout.tsx`

> Service : **app** · Server Component · ~65 lignes · le cadre de toutes les pages.

## 1. Rôle

Layout racine de Next.js : enveloppe **chaque page** avec la police, les métadonnées (titre,
description), le curseur personnalisé, le fondu entre les pages, les notifications, le **pied de
page légal**, et — pour un utilisateur connecté — le socket temps réel et le hub 3D persistant.

## 2. Dépendances

- **Importe** : `next/font/local` (police PixelGame), `components/library/TransitionOverlay`,
  `components/CustomCursor`, `components/Footer`, `components/ui/Toast` (`ToastProvider`),
  `components/realtime/RealtimeProvider`, `lib/session.ts`, `./HubBackground`, `./globals.css`.
- **Utilisé par** : Next.js (toutes les routes).

## 3. Explication bloc par bloc

- `metadata` : titre par défaut et modèle `"%s · ft_transcendence"` (chaque page donne son titre),
  description (SEO).
- `viewport.colorScheme = "dark"`.
- Rendu :

```tsx
<ToastProvider>
  <TransitionOverlay /> <CustomCursor />
  {session ? (
    <RealtimeProvider key={session.userId} userId={session.userId}>
      <HubBackground username={session.username} />
      {children}
    </RealtimeProvider>
  ) : children}
  <Footer />
</ToastProvider>
```

`key={session.userId}` : si un autre compte se connecte dans le même onglet, le fournisseur est
recréé (nouveau socket).

## 4. Flux concret

Un utilisateur connecté ouvre `/friends` : le hub est monté mais caché, le socket de chat est
ouvert (il est « en ligne »), la page Amis s'affiche, le pied de page reste en bas à gauche.

## 5. Points d'attention

- Le hub 3D est monté **une fois** ici et seulement caché sur les autres pages, pour ne pas
  reconstruire la scène WebGL à chaque retour.

## 6. Questions probables en évaluation

- **Où sont les liens Privacy/Terms ?** Dans `Footer`, rendu ici, donc sur toutes les pages.
- **Quand l'utilisateur devient-il « en ligne » ?** Quand `RealtimeProvider` connecte son socket,
  sur n'importe quelle page.
