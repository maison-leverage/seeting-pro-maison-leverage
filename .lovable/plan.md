

## Sélecteur de relance lors du clic "Réponse reçue"

### Objectif
Quand l'utilisateur clique "Réponse reçue", au lieu de marquer automatiquement le dernier envoi, afficher un petit menu pour choisir à quelle relance le prospect a répondu (Premier DM, Relance 1, Relance 2, Relance 3). Cela permet de savoir précisément quel message a fonctionné pour l'A/B test.

### Changements

**Fichier : `src/pages/DailyQueue.tsx`**

1. **Ajouter un state pour le sélecteur** : `replySelectProspect` qui stocke le prospect pour lequel on choisit la relance.

2. **Modifier le bouton "Réponse reçue"** : Au lieu d'appeler directement `handleReplyReceived`, il ouvre un petit Popover/Dialog avec les options :
   - Premier DM
   - Relance 1 (J+4)
   - Relance 2 (J+10)
   - Relance 3 (J+15)

3. **Modifier `handleReplyReceived`** : Ajouter un paramètre `replyToCategory` (ex: `first_dm_outbound`, `followup_1`, `followup_2`, `followup_3`). Au lieu de chercher le "dernier" `message_send`, chercher celui qui correspond à la catégorie sélectionnée pour ce prospect, et le marquer `got_reply: true`.

4. **UI** : Utiliser un composant `Popover` avec des boutons pour chaque option. Quand l'utilisateur clique une option, ça appelle `handleReplyReceived(prospect, category)` puis ferme le popover.

### Détails techniques

```text
Clic "Réponse reçue"
  └─> Popover s'ouvre
       ├─ "Premier DM"     → handleReplyReceived(prospect, 'first_dm_%source%')
       ├─ "Relance 1 (J+4)"  → handleReplyReceived(prospect, 'followup_1')
       ├─ "Relance 2 (J+10)" → handleReplyReceived(prospect, 'followup_2')
       └─ "Relance 3 (J+15)" → handleReplyReceived(prospect, 'followup_3')
```

- La requête Supabase dans `handleReplyReceived` filtrera par `prospect_id` ET `category` pour trouver le bon `message_send` à marquer comme ayant reçu une réponse
- Si aucun `message_send` n'est trouvé pour cette catégorie (envoi pas encore tracké), on marque quand même le prospect en statut `reponse` et on log l'activité
- Le `activity_log` inclura aussi la catégorie pour savoir quel type de message a généré la réponse

