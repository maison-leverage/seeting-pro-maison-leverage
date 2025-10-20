import { Prospect } from "@/types/prospect";

export const calculateProspectScore = (prospect: Prospect): number => {
  let score = 50; // Base score

  // Priority scoring (nombre de relances)
  const relanceCount = parseInt(prospect.priority);
  score += relanceCount * 3; // Plus de relances = plus de score

  // Qualification scoring (bombe de valeur)
  const qualificationScores = {
    loom: 15,
    video_youtube: 20,
    presentation_genspark: 25,
    magnus_opus: 30,
  };
  score += qualificationScores[prospect.qualification];

  // Status scoring
  const statusScores = {
    premier_message: 10,
    discussion: 20,
    r1_programme: 30,
  };
  score += statusScores[prospect.status];

  // Reminder date scoring (higher if date is close)
  if (prospect.reminderDate) {
    const today = new Date();
    const reminder = new Date(prospect.reminderDate);
    const daysUntil = Math.ceil((reminder.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil <= 0) score += 15; // Past due or today
    else if (daysUntil <= 3) score += 10;
    else if (daysUntil <= 7) score += 5;
  }

  // Recent activity scoring
  if (prospect.lastContact) {
    const daysSinceContact = Math.floor(
      (new Date().getTime() - new Date(prospect.lastContact).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceContact > 14) score -= 5;
    if (daysSinceContact > 30) score -= 10;
  }

  return Math.max(0, Math.min(100, score)); // Clamp between 0-100
};

export const updateProspectScore = (prospect: Prospect): Prospect => {
  return {
    ...prospect,
    score: calculateProspectScore(prospect),
  };
};
