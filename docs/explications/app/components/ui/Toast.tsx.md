# `app/components/ui/Toast.tsx`

> Service : **app** · Client Component · notifications

## 1. Rôle

`ToastProvider` (monté par le layout) et `useToast()` → `show(texte, ton)` : une notification en bas à gauche pendant 5 s (4 au plus à la fois), annoncée aux lecteurs d'écran.

## 2. Dépendances

- **Utilisé par** : layout, `RealtimeProvider` (nouveau message), hub et paquets (succès), amis, profil public, succès, vitrine.
- **Design system** : composant listé dans `docs/DESIGN_SYSTEM.md`, visible sur `/design-system`.

## 3. Explication bloc par bloc

Contexte React ; chaque toast a un id et se retire avec un `setTimeout`.

## 4. Flux concret

Nouveau message pendant qu'on est sur `/players` → « 💬 New message from bob ».

## 5. Points d'attention

- Aucun.

## 6. Questions probables en évaluation

- **Comment l'utilisateur est-il notifié ?** Toasts (messages, succès, actions).
