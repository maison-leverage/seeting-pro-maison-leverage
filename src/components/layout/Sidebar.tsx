import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  FileText,
  LogOut,
  Flame,
  Pin,
  LineChart,
  BookOpen,
  GraduationCap,
  ListChecks,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import maisonLeverageLogo from "@/assets/maison-leverage-logo.png";

const navigation = [
  { name: "Ma file du jour", href: "/daily", icon: ListChecks },
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  {
    name: "Prospects",
    icon: Users,
    subItems: [
      { name: "À relancer", href: "/prospects?view=today", icon: Pin },
      { name: "Prospects chauds", href: "/prospects?view=hot", icon: Flame },
      { name: "R1 Programmés", href: "/prospects?view=r1", icon: Calendar },
      { name: "Tous les prospects", href: "/prospects", icon: Users },
    ],
  },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  {
    name: "Templates",
    icon: FileText,
    subItems: [
      { name: "Bibliothèque de templates", href: "/templates", icon: BookOpen },
      { name: "Analytics des performances", href: "/templates/analytics", icon: LineChart },
    ],
  },
  { name: "Formation", href: "/formation", icon: GraduationCap },
];

interface SidebarProps {
  todayCount?: number;
}

const Sidebar = ({ todayCount = 0 }: SidebarProps) => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email || "");
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Déconnexion réussie");
    navigate("/auth");
  };

  const userName = userEmail.split("@")[0] || "User";

  return (
    <div className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex flex-col gap-2">
          <h1 className="font-bold text-lg text-foreground">Setting Pro LinkedIn</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">by</span>
            <img src={maisonLeverageLogo} alt="Maison Leverage" className="h-5 object-contain" />
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <div key={item.name}>
            {item.href ? (
              <NavLink
                to={item.href}
                end={item.href === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.name}</span>
                {item.name === "Ma file du jour" && todayCount > 0 && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                    {todayCount}
                  </span>
                )}
              </NavLink>
            ) : (
              <div className="flex items-center gap-3 px-3 py-2.5 text-sidebar-foreground">
                <item.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.name}</span>
                {item.name === "Prospects" && todayCount > 0 && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                    {todayCount}
                  </span>
                )}
              </div>
            )}

            {item.subItems && (
              <div className="ml-8 mt-1 space-y-1">
                {item.subItems.map((subItem) => (
                  <NavLink
                    key={subItem.name}
                    to={subItem.href}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                        isActive
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/30"
                      )
                    }
                  >
                    <subItem.icon className="w-4 h-4" />
                    <span>{subItem.name}</span>
                    {subItem.href.includes("today") && todayCount > 0 && (
                      <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold px-1.5 py-0.5 rounded badge-pulse">
                        {todayCount}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent/50">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            {userName[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start border-border/50 hover:border-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
