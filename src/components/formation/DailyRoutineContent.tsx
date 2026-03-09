import { Clock, Sun, MessageSquare, RotateCcw, ClipboardList, Zap } from "lucide-react";

const SectionTitle = ({ children, emoji }: { children: React.ReactNode; emoji: string }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="text-lg">{emoji}</span>
    <h3 className="text-lg font-bold text-foreground">{children}</h3>
  </div>
);

const Rule = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-2 text-sm leading-relaxed">
    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
    <span>{children}</span>
  </li>
);

const SubStep = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
    <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground/50 flex-shrink-0" />
    <span>{children}</span>
  </li>
);

const TimeBlock = ({
  number,
  hours,
  icon: Icon,
  title,
  children,
}: {
  number: number;
  hours: string;
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="p-4 rounded-xl bg-muted/30 border border-border">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-primary">{number}</span>
      </div>
      <div>
        <p className="font-semibold text-foreground text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{hours}</p>
      </div>
      <Icon className="w-5 h-5 text-primary/60 ml-auto" />
    </div>
    <div className="pl-12">{children}</div>
  </div>
);

const DailyRoutineContent = () => {
  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <p className="text-sm text-foreground/80">
          Suis exactement ce plan chaque jour. <strong>Pas de changement sans demander à Océane.</strong> Objectif : avoir le plus de réponses possibles des PDG.
        </p>
      </div>

      {/* Limites */}
      <div className="p-4 rounded-xl bg-muted/50 border border-border">
        <SectionTitle emoji="🛡️">Limites à ne jamais dépasser</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Connexions", value: "25 à 30 max/jour", color: "bg-primary/10 text-primary" },
            { label: "Messages au total", value: "60 à 100/jour", color: "bg-primary/10 text-primary" },
            { label: "InMail", value: "1 à 2/jour (15/mois)", color: "bg-amber-500/10 text-amber-600" },
            { label: "Likes & commentaires", value: "50 à 100/jour", color: "bg-emerald-500/10 text-emerald-600" },
          ].map((item) => (
            <div key={item.label} className={`p-3 rounded-lg border border-border ${item.color}`}>
              <p className="text-xs font-medium opacity-80">{item.label}</p>
              <p className="text-sm font-bold mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 italic">
          InMail : tu as seulement 15 InMail par mois sur Premium Business. Utilise-les seulement pour les PDG très intéressants.
        </p>
      </div>

      {/* Routine */}
      <div className="space-y-3">
        <SectionTitle emoji="⏰">Routine de la journée (environ 7 heures)</SectionTitle>

        <TimeBlock number={1} hours="2 heures" icon={Sun} title="Connexions">
          <ul className="space-y-1.5">
            <SubStep>Ouvre LinkedIn sur le compte d'Océane.</SubStep>
            <SubStep>Prends <strong className="text-foreground">25 à 30 PDG</strong> dans la liste que Océane t'a donnée (fichier Google Sheet ou fichier partagé).</SubStep>
            <SubStep>Pour chaque PDG :</SubStep>
          </ul>
          <div className="ml-4 mt-2 space-y-1">
            <ul className="space-y-1.5">
              <SubStep>Ouvre son profil.</SubStep>
              <SubStep>Lis vite : À propos + dernier post + actualité de l'entreprise.</SubStep>
              <SubStep>Note <strong className="text-foreground">un détail concret</strong> (exemple : "vu votre post sur la croissance" ou "nouvelle embauche").</SubStep>
              <SubStep>Mets un like sur un post récent + un commentaire court et pro (exemple : "Point intéressant sur ce sujet").</SubStep>
              <SubStep>Envoie la demande de connexion avec une note personnalisée (modèle obligatoire).</SubStep>
            </ul>
          </div>
          <div className="mt-2">
            <SubStep><strong className="text-foreground">Arrête à 30 connexions.</strong></SubStep>
          </div>
        </TimeBlock>

        <TimeBlock number={2} hours="2 heures" icon={MessageSquare} title="Messages d'ouverture">
          <ul className="space-y-1.5">
            <SubStep>Va dans la messagerie LinkedIn.</SubStep>
            <SubStep>Cherche les personnes qui ont <strong className="text-foreground">accepté la connexion hier</strong>.</SubStep>
            <SubStep>Envoie le message du <strong className="text-foreground">jour 0</strong> (modèle obligatoire) à tous ceux qui ont accepté.</SubStep>
            <SubStep>Si un PDG est très intéressant : utilise <strong className="text-foreground">1 InMail</strong> au lieu d'un message normal (note-le dans le CRM).</SubStep>
          </ul>
        </TimeBlock>

        <TimeBlock number={3} hours="2 heures" icon={RotateCcw} title="Relances">
          <ul className="space-y-1.5">
            <SubStep>Vérifie les non-réponses des jours précédents.</SubStep>
            <SubStep>Envoie :</SubStep>
          </ul>
          <div className="ml-4 mt-2 space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-semibold">J+4</span>
              <span className="text-muted-foreground">Relance 1 (modèle)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-semibold">J+10</span>
              <span className="text-muted-foreground">Relance 2 (modèle)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-semibold">J+15</span>
              <span className="text-muted-foreground">Relance 3 (dernière)</span>
            </div>
          </div>
          <ul className="space-y-1.5 mt-3">
            <SubStep>Fais <strong className="text-foreground">40 à 70 relances par jour</strong> pour arriver à 60-100 messages totaux.</SubStep>
            <SubStep><strong className="text-foreground">Jamais plus de 3 relances</strong> par personne.</SubStep>
          </ul>
        </TimeBlock>

        <TimeBlock number={4} hours="1 heure" icon={ClipboardList} title="Mise à jour CRM">
          <ul className="space-y-1.5">
            <SubStep>Ouvre le CRM Lovable. Note pour chaque PDG touché :</SubStep>
          </ul>
          <div className="ml-4 mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            {[
              "Nom + entreprise + lien profil",
              "Détail personnalisé utilisé",
              'Type : Ouverture / Relance 1-2-3 / InMail',
              "Date + Statut",
              "Si RDV : lien iClose + date",
            ].map((item) => (
              <div key={item} className="p-2 rounded bg-muted/50 border border-border">{item}</div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-primary font-medium">
              📩 Envoie à Océane par WhatsApp : "Aujourd'hui : X connexions, Y messages ouverture, Z relances, W InMail utilisés, V RDV bookés via iClose"
            </p>
          </div>
        </TimeBlock>
      </div>

      {/* Règles importantes */}
      <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
        <SectionTitle emoji="⚠️">Règles importantes</SectionTitle>
        <ul className="space-y-2.5">
          <Rule>Toujours <strong>un détail personnalisé</strong> (c'est obligatoire pour avoir plus de réponses).</Rule>
          <Rule>Messages courts (<strong>moins de 90 mots</strong>), valeur d'abord (audit gratuit), pas de vente directe.</Rule>
          <Rule>Si doute ou problème : <strong>arrête et demande à Océane</strong> avant d'envoyer.</Rule>
          <Rule>Jamais répondre aux PDG toi-même : <strong>forwarde le message à Océane</strong>.</Rule>
        </ul>
      </div>

      {/* Footer */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
        <p className="text-sm font-medium text-foreground">
          Suis ça tous les jours = <strong className="text-primary">10 à 15 RDV par mois possible.</strong>
        </p>
      </div>
    </div>
  );
};

export default DailyRoutineContent;
