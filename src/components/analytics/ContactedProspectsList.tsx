import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";

interface ContactedProspect {
  id: string;
  prospect_id: string;
  prospect_name: string;
  prospect_company: string;
  first_dm_date: string;
  has_replied: boolean;
  has_call: boolean;
  linkedin_url?: string;
  current_status: string;
}

interface ContactedProspectsListProps {
  prospects: ContactedProspect[];
  loading?: boolean;
  onViewProspect?: (prospectId: string) => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  nouveau: { label: 'Nouveau', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  discussion: { label: 'Discussion', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  r1_programme: { label: 'R1 Programmé', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  perdu: { label: 'Perdu', color: 'bg-destructive/20 text-destructive border-destructive/30' },
  pas_interesse: { label: 'Pas intéressé', color: 'bg-muted/50 text-muted-foreground border-border' },
};

const ContactedProspectsList = ({ prospects, loading, onViewProspect }: ContactedProspectsListProps) => {
  if (loading) {
    return (
      <Card className="p-6 border-border/50 bg-card/50">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-border/50 bg-card/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Prospects Contactés
        </h2>
        <Badge variant="outline">{prospects.length} prospects</Badge>
      </div>

      {prospects.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          Aucun prospect contacté sur cette période.
        </p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {prospects.map((prospect) => {
            const status = statusConfig[prospect.current_status] || statusConfig.nouveau;
            return (
              <div 
                key={prospect.id}
                className="flex items-center justify-between p-3 rounded-lg bg-card-hover border border-border/30 hover:border-primary/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{prospect.prospect_name}</span>
                    <Badge variant="outline" className={status.color}>
                      {status.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span>{prospect.prospect_company}</span>
                    <span className="text-xs">
                      1er DM : {format(parseISO(prospect.first_dm_date), "dd MMM à HH:mm", { locale: fr })}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {/* Status indicators */}
                  <div className="flex gap-1">
                    {prospect.has_replied && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                        Répondu
                      </Badge>
                    )}
                    {prospect.has_call && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                        R1
                      </Badge>
                    )}
                  </div>
                  
                  {/* Actions */}
                  {prospect.linkedin_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0"
                    >
                      <a href={prospect.linkedin_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {onViewProspect && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewProspect(prospect.prospect_id)}
                      className="h-8 px-2 text-xs"
                    >
                      Voir
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default ContactedProspectsList;
