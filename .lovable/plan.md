

## Problème identifié

La section "Réponses à traiter" affiche **34 réponses** (= toutes les réponses depuis le début) au lieu de seulement celles du jour. La cause : le filtre utilise `updated_at` du prospect, mais **il n'y a aucun trigger** sur la table `prospects` pour mettre à jour ce champ automatiquement. Donc `updated_at` reste à la date de création et le filtre ne fonctionne jamais correctement.

## Solution

Deux corrections complémentaires :

### 1. Créer le trigger `updated_at` manquant (migration SQL)

Attacher la fonction `update_updated_at_column()` (qui existe déjà) à la table `prospects` via un trigger `BEFORE UPDATE`. Cela garantit que `updated_at` est mis à jour à chaque modification de prospect.

De plus, backfiller les prospects existants au statut `reponse` : mettre leur `updated_at` à la date de leur dernière activité `reply_received` dans `activity_logs`.

### 2. Changer le filtre "Réponses" pour utiliser `activity_logs` (plus fiable)

**Fichier : `src/pages/DailyQueue.tsx`**

Au lieu de filtrer sur `updatedAt` du prospect (fragile), charger les IDs des prospects ayant un `activity_log` de type `reply_received` créé aujourd'hui. Filtrer la section "Réponses à traiter" avec cette liste.

- Ajouter un state `todayReplyProspectIds: Set<string>` alimenté par une requête sur `activity_logs` filtrée sur `created_at >= todayStart`.
- Remplacer le filtre actuel (lignes 280-284) :
  ```
  // Avant (ne fonctionne pas)
  if (p.status !== 'reponse') return false;
  const updatedAt = new Date(p.updatedAt || p.createdAt);
  return updatedAt >= todayStart && updatedAt <= todayEnd;

  // Après (fiable)
  if (p.status !== 'reponse') return false;
  return todayReplyProspectIds.has(p.id);
  ```
- La requête sera intégrée dans `loadTodayCount()` qui s'exécute déjà au mount et après chaque action.

### Résultat attendu

- Le compteur "Réponses" repart à **0 chaque jour**
- Seuls les prospects ayant reçu une réponse **aujourd'hui** apparaissent dans la section
- Le trigger corrige aussi le problème pour tout futur usage de `updated_at`

