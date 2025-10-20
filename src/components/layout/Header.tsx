import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import AlertCenter from "@/components/alerts/AlertCenter";
import { Prospect } from "@/types/prospect";
import { Template } from "@/types/template";

interface HeaderProps {
  onNewProspect?: () => void;
  notificationCount?: number;
}

const Header = ({ onNewProspect, notificationCount = 0 }: HeaderProps) => {
  const navigate = useNavigate();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    const storedProspects = localStorage.getItem("crm_prospects");
    const storedTemplates = localStorage.getItem("crm_templates");
    if (storedProspects) setProspects(JSON.parse(storedProspects));
    if (storedTemplates) setTemplates(JSON.parse(storedTemplates));
  }, []);

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-40">
      <div className="h-full px-6 flex items-center justify-between gap-6">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un prospect, une entreprise..."
              className="pl-10 bg-input border-border/50 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications/Alerts */}
          <AlertCenter prospects={prospects} templates={templates} />

          {/* New Prospect */}
          <Button
            onClick={() => {
              if (onNewProspect) {
                onNewProspect();
              } else {
                navigate("/prospects?new=true");
              }
            }}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-lg hover:shadow-xl glow-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouveau prospect
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
