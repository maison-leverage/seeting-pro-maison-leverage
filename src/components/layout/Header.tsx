import { useState } from "react";
import { Search, Plus, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  onNewProspect?: () => void;
  notificationCount?: number;
}

const Header = ({ onNewProspect, notificationCount = 0 }: HeaderProps) => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchValue.trim();
    if (query) {
      navigate(`/prospects?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-40">
      <div className="h-full px-6 flex items-center justify-between gap-6">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Rechercher un prospect, une entreprise..."
              className="pl-10 bg-input border-border/50 focus:border-primary transition-all"
            />
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/prospects?view=today")}
            className="relative border-border/50 hover:border-primary hover:bg-primary/10 transition-all"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                {notificationCount}
              </span>
            )}
          </Button>

          <Button
            onClick={() => {
              if (onNewProspect) {
                onNewProspect();
              } else {
                navigate("/prospects?new=true");
              }
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
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
