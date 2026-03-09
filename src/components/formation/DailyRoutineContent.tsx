import { Clock, Shield, Sun, MessageSquare, RotateCcw, ClipboardList, Zap } from "lucide-react";

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
  time,
  hours,
  icon: Icon,
  title,
  children,
}: {
  number: number;
  time: string;
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
        <p className="text-xs text-muted-foreground">{time} — {hours}</p>
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
      <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
        <p className="text-sm font-semibold text-destructive mb-1">⚠️ SOP OBLIGATOIRE</p>
        <p className="text-sm text-foreground/80">
          Suis-le à la lettre comme un robot. Objectif : taux de réponse le plus haut possible
          (benchmarks terrain 2026 : <strong>12-20 % reply DM</strong> + <strong>18-25 % InMail</strong> avec personnalisation forte).
          Liste PDG prête. Accès Premium Business (15 InMails/mois max).
        </p>
      </div>

      {/* Volume safe */}
      <div className="p-4 rounded-xl bg-muted/50 border border-border">
        <SectionTitle emoji="🛡️">Volume safe quotidien (ne jamais dépasser)</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Connexions", value: "25-30 max/jour", color: "bg-primary/10 text-primary" },
            { label: "Messages / Relances", value: "60-100 max/jour", color: "bg-primary/10 text-primary" },
            { label: "InMails", value: "1-2 max/jour (15/mois)", color: "bg-amber-500/10 text-amber-600" },
            { label: "Warm-up", value: "50-100 actions", color: "bg-emerald-500/10 text-emerald-600" },
          ].map((item) => (
            <div key={item.label} className={`p-3 rounded-lg border border-border ${item.color}`}>
              <p className="text-xs font-medium opacity-80">{item.label}</p>
              <p className="text-sm font-bold mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Routine */}
      <div className="space-y-3">
        <SectionTitle emoji="⏰">Routine exacte (7h/jour — 5 jours/semaine)</SectionTitle>

        <TimeBlock number={1} time="8h-10h" hours="2h" icon={Sun} title="Warm-up + Connexions">
          <ul className="space-y-1.5">
            <SubStep>Ouvre LinkedIn Premium.</SubStep>
            <SubStep>Prends <strong className="text-foreground">25-30 PDG</strong> de la liste prête.</SubStep>
            <SubStep>Pour chaque : ouvre profil → lis 20-30s (À propos + dernier post + actu entreprise).</SubStep>
            <SubStep>Note <strong className="text-foreground">1 détail concret</strong> (ex : "post sur croissance 2025", "nouvelle embauche").</SubStep>
            <SubStep>Like 1 post récent + commente court et pro (ex : "Point très pertinent sur [sujet]").</SubStep>
            <SubStep>Envoie connexion + note perso (modèle obligatoire — max 300 caractères).</SubStep>
            <SubStep><strong className="text-foreground">Arrête à 30 connexions.</strong></SubStep>
          </ul>
        </TimeBlock>

        <TimeBlock number={2} time="10h-12h" hours="2h" icon={MessageSquare} title="Messages d'ouverture">
          <ul className="space-y-1.5">
            <SubStep>Va dans Messagerie → filtre "Connexions récentes" (acceptations veille).</SubStep>
            <SubStep>Envoie message <strong className="text-foreground">Jour 0</strong> à tous les nouveaux acceptés (modèle obligatoire — valeur audit + 700k clics).</SubStep>
            <SubStep>Si très haut potentiel : utilise <strong className="text-foreground">1 InMail</strong> au lieu de DM (log "InMail" dans CRM).</SubStep>
          </ul>
        </TimeBlock>

        <TimeBlock number={3} time="13h-15h" hours="2h" icon={RotateCcw} title="Relances + InMails sélectifs">
          <ul className="space-y-1.5">
            <SubStep>Relance les non-réponses :</SubStep>
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
              <span className="text-muted-foreground">Relance 3 (dernier — poli)</span>
            </div>
          </div>
          <ul className="space-y-1.5 mt-3">
            <SubStep>Envoie max <strong className="text-foreground">1-2 InMails/jour</strong> uniquement aux PDG les plus chauds (log dans CRM).</SubStep>
            <SubStep><strong className="text-foreground">Jamais plus de 3 relances</strong> par personne.</SubStep>
          </ul>
        </TimeBlock>

        <TimeBlock number={4} time="15h-16h" hours="1h" icon={ClipboardList} title="Tracking CRM">
          <ul className="space-y-1.5">
            <SubStep>Ouvre Lovable CRM. Pour chaque action :</SubStep>
          </ul>
          <div className="ml-4 mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            {[
              "Nom + Entreprise + Lien profil",
              "Détail personnalisé utilisé",
              'Type : Ouverture / Relance / InMail',
              "Date + Statut",
              "Si RDV : lien iClose + date",
            ].map((item) => (
              <div key={item} className="p-2 rounded bg-muted/50 border border-border">{item}</div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-primary font-medium">
              📩 Envoie à Océane par WhatsApp : "Aujourd'hui : X connexions, Y messages ouverture, Z relances, W InMails utilisés, V RDV bookés via iClose"
            </p>
          </div>
        </TimeBlock>
      </div>

      {/* Règles max reply */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <SectionTitle emoji="🚀">Règles pour max reply rate (2026)</SectionTitle>
        <ul className="space-y-2.5">
          <Rule>Toujours <strong>1 détail perso</strong> (boost +27 % reply).</Rule>
          <Rule>Messages <strong>&lt; 90 mots</strong>, valeur d'abord, CTA clair (audit 10 min).</Rule>
          <Rule>Timing : privilégie <strong>jeudi/vendredi matin</strong>.</Rule>
          <Rule>Si doute : <strong>arrête et demande à Océane</strong>.</Rule>
          <Rule>Jamais répondre aux PDG toi-même (<strong>forward direct</strong>).</Rule>
        </ul>
      </div>

      {/* Footer */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
        <p className="text-sm font-medium text-foreground">
          Ce SOP est la référence unique. <strong className="text-primary">Respecte-le = 10-15 RDV/mois réaliste.</strong>
        </p>
      </div>
    </div>
  );
};

export default DailyRoutineContent;
