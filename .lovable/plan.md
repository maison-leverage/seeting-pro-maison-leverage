

# Plan : Améliorer le CRM pour simplifier le travail quotidien du setter

## Problème actuel
Le setter n'utilise pas le CRM de manière régulière car il y a trop de friction. Les relances sont un simple compteur (1, 2, 3...) sans distinction de timing ni de type de message. Le CRM ne correspond pas au SOP quotidien (J+4, J+10, J+15).

## Ce qu'on va construire

### 1. Relances intelligentes avec timing automatique
Quand le setter clique "Relance", le CRM :
- Détecte automatiquement si c'est la relance 1, 2 ou 3 (basé sur `follow_up_count`)
- Bloque à 3 relances max (comme le SOP)
- Calcule et affiche la prochaine date de relance automatiquement (J+4, J+10, J+15 après le 1er DM)
- Met à jour `reminder_date` automatiquement à la prochaine relance

### 2. Type de message (DM vs InMail)
Ajout d'un champ `message_type` sur la table `activity_logs` pour distinguer :
- DM classique
- InMail (limité à 15/mois)

Quand le setter clique "1er DM" ou "Relance", une petite modale rapide demande : **DM ou InMail ?** (un seul clic).

Le dashboard affichera le compteur InMails utilisés ce mois.

### 3. Vue "À faire aujourd'hui" améliorée
Transformer le dashboard pour qu'il colle exactement à la routine quotidienne :
- **Bloc Matin** : Nombre de connexions restantes à envoyer (objectif 25-30)
- **Bloc Midi** : Liste des acceptations à contacter (prospects avec `status = rien` et pas encore de 1er DM)
- **Bloc Après-midi** : Liste des relances du jour avec le numéro de relance (J+4, J+10, J+15) calculé automatiquement
- **Bloc Fin de journée** : Résumé à copier-coller pour envoyer à Océane sur WhatsApp

### 4. Résumé WhatsApp auto-généré
Un bouton "Copier le résumé du jour" qui génère :
```
Aujourd'hui : X connexions, Y messages ouverture, Z relances, W InMails utilisés, V RDV bookés via iClose
```
Prêt à coller dans WhatsApp.

### 5. Indicateur visuel de relance sur la ProspectCard
Remplacer le badge de relance actuel par un indicateur plus clair :
- Afficher "Relance 1 (J+4)" / "Relance 2 (J+10)" / "Relance 3 - dernière (J+15)"
- Badge rouge si la relance est en retard
- Badge vert si c'est fait
- Bloquer le bouton relance si la date n'est pas encore arrivée (trop tôt)

## Changements techniques

### Database
- Ajouter colonne `message_type` (text, nullable, default 'dm') sur `activity_logs` pour tracker DM vs InMail
- Pas d'autres tables nécessaires

### Fichiers modifiés
- `src/components/prospects/ProspectCard.tsx` : Relance intelligente (numéro + timing + type DM/InMail), blocage à 3 max, calcul auto reminder_date
- `src/components/dashboard/TodayActivityCard.tsx` : Ajouter compteur InMails du mois + résumé WhatsApp copiable
- `src/pages/Dashboard.tsx` : Bloc "relances du jour" avec dates calculées
- `src/types/prospect.ts` : Aucun changement nécessaire

### Fichiers créés
- `src/components/prospects/MessageTypeSelector.tsx` : Mini-modale DM / InMail (un clic)

