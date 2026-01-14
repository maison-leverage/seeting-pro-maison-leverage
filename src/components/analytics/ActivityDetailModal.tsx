import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle, Phone, CheckCircle, RotateCcw, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface ActivityLog {
  id: string;
  type: 'message_sent' | 'reply_received' | 'call_booked' | 'deal_closed' | 'first_dm' | 'follow_up_dm';
  created_at: string;
  user_name: string;
  lead_id: string;
  prospect_name?: string;
  prospect_company?: string;
}

type ActivityCategory = 'dms' | 'replies' | 'calls' | 'deals';

interface ActivityDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: ActivityCategory;
  activities: ActivityLog[];
  periodLabel: string;
}

const categoryConfig: Record<ActivityCategory, { 
  title: string; 
  icon: React.ComponentType<{ className?: string }>; 
  color: string;
  bgColor: string;
  types: ActivityLog['type'][];
}> = {
  dms: {
    title: "DMs Envoyés",
    icon: Send,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    types: ['first_dm', 'message_sent', 'follow_up_dm']
  },
  replies: {
    title: "Réponses Reçues",
    icon: MessageCircle,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    types: ['reply_received']
  },
  calls: {
    title: "R1 Programmés",
    icon: Phone,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    types: ['call_booked']
  },
  deals: {
    title: "Deals Closés",
    icon: CheckCircle,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    types: ['deal_closed']
  }
};

const ActivityDetailModal = ({ open, onOpenChange, category, activities, periodLabel }: ActivityDetailModalProps) => {
  const config = categoryConfig[category];
  const Icon = config.icon;
  
  // Filter activities by category
  const filteredActivities = activities.filter(a => config.types.includes(a.type));
  
  // Group by prospect to show unique prospects with count
  const prospectMap = new Map<string, {
    prospect_name: string;
    prospect_company: string;
    lead_id: string;
    count: number;
    dates: string[];
    types: ActivityLog['type'][];
  }>();
  
  filteredActivities.forEach(activity => {
    const existing = prospectMap.get(activity.lead_id);
    if (existing) {
      existing.count++;
      existing.dates.push(activity.created_at);
      if (!existing.types.includes(activity.type)) {
        existing.types.push(activity.type);
      }
    } else {
      prospectMap.set(activity.lead_id, {
        prospect_name: activity.prospect_name || 'Prospect archivé',
        prospect_company: activity.prospect_company || '',
        lead_id: activity.lead_id,
        count: 1,
        dates: [activity.created_at],
        types: [activity.type]
      });
    }
  });
  
  const uniqueProspects = Array.from(prospectMap.values()).sort((a, b) => {
    // Sort by most recent date
    const dateA = new Date(a.dates[a.dates.length - 1]).getTime();
    const dateB = new Date(b.dates[b.dates.length - 1]).getTime();
    return dateB - dateA;
  });

  const getTypeLabel = (type: ActivityLog['type']) => {
    switch (type) {
      case 'first_dm': return '1er DM';
      case 'follow_up_dm': return 'Relance';
      case 'message_sent': return 'Message';
      case 'reply_received': return 'Réponse';
      case 'call_booked': return 'R1';
      case 'deal_closed': return 'Deal';
      default: return type;
    }
  };

  const getTypeBadgeColor = (type: ActivityLog['type']) => {
    switch (type) {
      case 'first_dm':
      case 'message_sent':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'follow_up_dm':
        return 'bg-cyan-100 text-cyan-700 border-cyan-300';
      case 'reply_received':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'call_booked':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'deal_closed':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <Icon className={`h-5 w-5 ${config.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span>{config.title}</span>
                <Badge variant="secondary" className="text-lg px-3">
                  {uniqueProspects.length}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                {periodLabel}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[500px] pr-4">
          {uniqueProspects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aucune activité pour cette période
            </div>
          ) : (
            <div className="space-y-3">
              {uniqueProspects.map((prospect, index) => (
                <div 
                  key={prospect.lead_id}
                  className="p-4 rounded-lg border border-border/50 bg-card/50 hover:bg-card/80 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground font-mono">
                          #{index + 1}
                        </span>
                        <h4 className="font-semibold text-foreground truncate">
                          {prospect.prospect_name}
                        </h4>
                      </div>
                      {prospect.prospect_company && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {prospect.prospect_company}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {prospect.types.map((type, i) => (
                          <Badge 
                            key={i} 
                            variant="outline" 
                            className={`text-xs ${getTypeBadgeColor(type)}`}
                          >
                            {getTypeLabel(type)}
                            {prospect.types.length === 1 && prospect.count > 1 && ` ×${prospect.count}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm text-muted-foreground">
                        {format(parseISO(prospect.dates[prospect.dates.length - 1]), "dd MMM yyyy", { locale: fr })}
                      </div>
                      {prospect.dates.length > 1 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {prospect.dates.length} interactions
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="pt-4 border-t border-border/50">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Total : {filteredActivities.length} activités</span>
            <span>{uniqueProspects.length} prospects uniques</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityDetailModal;
