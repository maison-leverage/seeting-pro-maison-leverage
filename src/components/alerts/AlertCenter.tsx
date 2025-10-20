import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Prospect } from "@/types/prospect";
import { Template } from "@/types/template";
import { Bell, AlertCircle, TrendingUp, AlertTriangle, Award, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface Alert {
  id: string;
  type: "urgent" | "opportunity" | "warning" | "success";
  title: string;
  description: string;
  action?: { label: string; path: string };
  createdAt: string;
}

interface AlertCenterProps {
  prospects: Prospect[];
  templates: Template[];
}

const AlertCenter = ({ prospects, templates }: AlertCenterProps) => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [viewedAlerts, setViewedAlerts] = useState<string[]>([]);

  useEffect(() => {
    const viewed = localStorage.getItem("crm_viewed_alerts");
    if (viewed) {
      setViewedAlerts(JSON.parse(viewed));
    }
  }, []);

  useEffect(() => {
    const newAlerts = generateAlerts(prospects, templates);
    setAlerts(newAlerts);
  }, [prospects, templates]);

  const generateAlerts = (prospects: Prospect[], templates: Template[]): Alert[] => {
    const alerts: Alert[] = [];
    
    // 1. Prospects urgents (reminder aujourd'hui ou en retard)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = prospects.filter((p) => {
      if (!p.reminderDate) return false;
      const reminder = new Date(p.reminderDate);
      reminder.setHours(0, 0, 0, 0);
      return reminder <= today;
    });
    
    if (overdue.length > 0) {
      alerts.push({
        id: "urgent-reminders",
        type: "urgent",
        title: `${overdue.length} prospect(s) à relancer`,
        description: "Des prospects attendent une relance aujourd'hui",
        action: { label: "Voir", path: "/prospects?view=today" },
        createdAt: new Date().toISOString(),
      });
    }
    
    // 2. Prospects chauds en attente (>7 jours sans contact)
    const hotWaiting = prospects.filter((p) => {
      if (p.hype !== "chaud" || p.status === "r1_programme") return false;
      const lastContact = p.lastContact ? new Date(p.lastContact) : new Date(p.createdAt);
      const daysSince = (Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > 7;
    });
    
    if (hotWaiting.length > 0) {
      alerts.push({
        id: "opportunity-hot",
        type: "opportunity",
        title: `${hotWaiting.length} prospect(s) chaud(s) sans R1`,
        description: "Ils sont intéressés mais tu ne les as pas relancés depuis 7 jours",
        action: { label: "Voir", path: "/prospects?view=hot" },
        createdAt: new Date().toISOString(),
      });
    }
    
    // 3. Templates sous-performants (>30 envois, <10% réponse)
    const underperforming = templates.filter(
      (t) => t.metrics.sends > 30 && t.metrics.responseRate < 10
    );
    
    if (underperforming.length > 0) {
      alerts.push({
        id: "warning-templates",
        type: "warning",
        title: `${underperforming.length} template(s) sous-performant(s)`,
        description: "Ces templates ont un faible taux de réponse malgré beaucoup d'envois",
        action: { label: "Voir", path: "/templates" },
        createdAt: new Date().toISOString(),
      });
    }
    
    // 4. Milestones
    const r1Count = prospects.filter((p) => p.status === "r1_programme").length;
    const milestones = [
      { count: 10, label: "10e R1 booké" },
      { count: 25, label: "25e R1 booké" },
      { count: 50, label: "50e R1 booké" },
      { count: 100, label: "100e R1 booké" },
    ];
    
    const milestone = milestones.find((m) => m.count === r1Count);
    if (milestone) {
      alerts.push({
        id: `milestone-r1-${r1Count}`,
        type: "success",
        title: `🎉 ${milestone.label}`,
        description: "Félicitations ! Continue comme ça !",
        createdAt: new Date().toISOString(),
      });
    }
    
    return alerts;
  };

  const unviewedAlerts = alerts.filter((a) => !viewedAlerts.includes(a.id));

  const handleAlertClick = (alert: Alert) => {
    if (alert.action) {
      navigate(alert.action.path);
    }
    markAsViewed(alert.id);
  };

  const markAsViewed = (alertId: string) => {
    const updated = [...viewedAlerts, alertId];
    setViewedAlerts(updated);
    localStorage.setItem("crm_viewed_alerts", JSON.stringify(updated));
  };

  const dismissAlert = (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsViewed(alertId);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "urgent":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "opportunity":
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "success":
        return <Award className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "urgent":
        return "bg-red-500/10 border-red-500/20 hover:bg-red-500/20";
      case "opportunity":
        return "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20";
      case "warning":
        return "bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20";
      case "success":
        return "bg-green-500/10 border-green-500/20 hover:bg-green-500/20";
      default:
        return "bg-muted/50 border-border hover:bg-muted";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative border-border/50 hover:border-primary hover:bg-primary/10 transition-all"
        >
          <Bell className="w-5 h-5" />
          {unviewedAlerts.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {unviewedAlerts.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-popover border-border p-0">
        <div className="p-3 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alertes ({unviewedAlerts.length})
          </h3>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {unviewedAlerts.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              Aucune alerte pour le moment 👍
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {unviewedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => handleAlertClick(alert)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${getAlertColor(
                    alert.type
                  )}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">{getAlertIcon(alert.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-sm">{alert.title}</div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={(e) => dismissAlert(alert.id, e)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.description}
                      </p>
                      {alert.action && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {alert.action.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AlertCenter;
