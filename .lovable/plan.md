

## Sélecteur de variantes réelles dans le popover "Réponse reçue"

### Problème actuel
Le fallback manuel affiche juste "Premier DM", "Relance 1", etc. sans distinguer les variantes A/B. Et même quand il y a des envois trackés, le groupement n'est pas clair. On veut que le sélecteur affiche **toutes les variantes de la bibliothèque**, groupées par catégorie, pour un tracking A/B précis.

### Solution

**Fichier : `src/pages/DailyQueue.tsx`** — Refactorer les deux popovers (sections overdue/today/new + responses)

1. **Toujours afficher toutes les variantes actives** au lieu de se baser uniquement sur les `message_sends` du prospect. Le popover liste les variantes groupées par catégorie depuis la bibliothèque (déjà chargées dans `variants`).

2. **Groupement par catégorie avec labels lisibles** :
```text
📩 Premier DM — Inbound
   ├─ Variante A (Curiosité)
   └─ Variante B (Audit rapide)
📩 Premier DM — Visiteur Profil
   ├─ Variante A (Timide)
   └─ Variante B (Audit concurrents)
📩 Premier DM — Relation Dormante
   ├─ Variante A (Direct)
   └─ Variante B (Big Idea IA)
🔄 Relance 1
   ├─ Variante A (Mini-audit PDF)
   └─ Variante B (Rappel doux)
🔄 Relance 2
   └─ Variante A (Concurrents)
```

3. **Au clic sur une variante** : appeler `handleReplyReceived(prospect, category)` avec le `variant_id` en plus, pour marquer le bon `message_send` (s'il existe) OU logger l'activité avec la variante exacte.

4. **Modifier `handleReplyReceived`** pour accepter un `variantId` optionnel. Si un `message_send` existe pour ce prospect + variant_id, marquer `got_reply: true`. Sinon, logger quand même l'activité avec le `variant_id` pour le tracking.

5. **Extraire le popover dans un composant `ReplyVariantSelector`** pour éviter la duplication du code entre les sections.

### Détails techniques

- Les `variants` sont déjà chargées au mount dans le state. On les groupe avec `Object.groupBy` ou reduce par `category`.
- Labels des catégories : map `first_dm_inbound` → "Premier DM — Inbound", `followup_1` → "Relance 1", etc.
- Le `PopoverContent` utilisera un `ScrollArea` pour gérer beaucoup de variantes.
- Signature mise à jour : `handleReplyReceived(prospect, category, variantId?)`.

