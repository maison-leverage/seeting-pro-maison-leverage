import { ShieldAlert, MessageSquare, ListChecked, Clock, Ban, Trophy } from "lucide-react";

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

const Step = ({ number, time, children }: { number: number; time: string; children: React.ReactNode }) => (
  <div className="flex gap-3 items-start">
    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
      <span className="text-sm font-bold text-primary">{number}</span>
    </div>
    <div className="text-sm leading-relaxed">
      <span className="font-semibold text-foreground">{time}</span>
      <span className="text-muted-foreground"> — {children}</span>
    </div>
  </div>
);

const CadrageContent = () => {
  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
        <p className="text-sm font-semibold text-destructive mb-1">⚠️ Document obligatoire</p>
        <p className="text-sm text-foreground/80">
          Lis-le entièrement avant de commencer. Suis <strong>TOUT</strong> à la lettre, comme un robot : pas d'initiative, pas de changement sans validation. L'AI CRM référence ce SOP pour toute aide.
        </p>
      </div>

      {/* Rôle */}
      <div className="p-4 rounded-xl bg-muted/50 border border-border">
        <SectionTitle emoji="🎯">Ton rôle</SectionTitle>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Tu envoies des messages et connexions pour <strong>booker des RDV de 10-15 min</strong> via iClose (lien fourni par Océane).
        </p>
        <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm font-medium text-primary">
            📊 Objectif : 10-15 RDV bookés/mois quand rodé (8-12 au début)
          </p>
        </div>
      </div>

      {/* Règles */}
      <div className="p-4 rounded-xl bg-muted/50 border border-border">
        <SectionTitle emoji="📋">Règles à suivre sans déroger</SectionTitle>
        <ul className="space-y-2.5">
          <Rule>Toujours pro : <strong>"Bonjour [Prénom],"</strong> et <strong>"Cordialement"</strong>. Pas de "Salut", emoji, phrases trop longues ou familières.</Rule>
          <Rule>Messages courts : <strong>moins de 90 mots</strong>. Valeur d'abord (audit gratuit visibilité Google/IA).</Rule>
          <Rule>Personnalisation : utilise <strong>1 détail du profil</strong> (dernier post ou actu entreprise) – obligatoire pour chaque envoi.</Rule>
          <Rule>Relances : <strong>maximum 3</strong> (pas plus).</Rule>
          <Rule>Volume quotidien max : <strong>25-35 connexions + 60-100 messages/relances</strong> (pas plus pour éviter ban LinkedIn).</Rule>
          <Rule>Hors cible : <strong>jamais</strong> (seulement PDG France, 11-200 salariés).</Rule>
        </ul>
      </div>

      {/* Process quotidien */}
      <div className="p-4 rounded-xl bg-muted/50 border border-border">
        <SectionTitle emoji="⏰">Process quotidien (35h/semaine)</SectionTitle>
        <p className="text-sm text-muted-foreground mb-4">La liste de PDG est déjà prête (fichier fourni).</p>
        <div className="space-y-4">
          <Step number={1} time="Matin (2h)">
            Prends 35 PDG de la liste → lis profil 20-30s → like/comment 1 post → envoie connexion + note perso (modèle fourni).
          </Step>
          <Step number={2} time="Milieu (2h)">
            Aux acceptations de la veille → envoie message Jour 0 (modèle).
          </Step>
          <Step number={3} time="Après-midi (2h)">
            Relances (J+4, J+10, J+15).
          </Step>
          <Step number={4} time="Fin (1h)">
            Mets tout dans le CRM (nom, détail perso utilisé, date, statut, lien iClose si RDV). Envoie à Océane et Maxime : <strong>"Aujourd'hui : X connexions, Y réponses, Z RDV bookés via iClose"</strong>.
          </Step>
        </div>
      </div>

      {/* Ce que tu ne fais JAMAIS */}
      <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/15">
        <SectionTitle emoji="🚫">Ce que tu NE fais JAMAIS</SectionTitle>
        <ul className="space-y-2.5">
          <Rule>Changer un mot dans les modèles <strong>sans OK</strong> Océane ou Maxime.</Rule>
          <Rule>Répondre toi-même à un PDG (<strong>forward le message</strong>).</Rule>
          <Rule>Booker <strong>sans le lien iClose</strong> d'Océane.</Rule>
          <Rule>Ajouter des PDG <strong>hors liste</strong>.</Rule>
          <Rule>Relancer <strong>plus de 3 fois</strong>.</Rule>
          <Rule>Envoyer <strong>plus de 35 connexions/jour</strong>.</Rule>
        </ul>
      </div>

      {/* Motivation */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <SectionTitle emoji="💰">Motivation & Bonus</SectionTitle>
        <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
          <p>
            Pour chaque RDV booké qui se transforme en client fermé (closing 20-30 % terrain), tu gagnes <strong className="text-primary">100 € bonus</strong>.
          </p>
          <p>
            Si 10-15 RDV/mois → <strong>2-4-5 clients/mois</strong> pour un bon début possible si tu suis sérieusement.
          </p>
          <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm font-medium">
              💡 Si doute sur une action : <strong>arrête et demande</strong> à Océane ou Maxime avant envoi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CadrageContent;
