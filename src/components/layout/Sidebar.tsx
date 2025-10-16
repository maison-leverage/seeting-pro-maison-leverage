import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Linkedin,
  Flame,
  Clock,
  XCircle,
  Pin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  {
    name: "Prospects",
    href: "/prospects",
    icon: Users,
    badge: 0,
    subItems: [
      { name: "À relancer aujourd'hui", href: "/prospects?view=today", icon: Pin },
      { name: "Prospects chauds", href: "/prospects?view=hot", icon: Flame },
      { name: "En attente", href: "/prospects?view=waiting", icon: Clock },
      { name: "Tous les prospects", href: "/prospects", icon: Users },
      { name: "Refus", href: "/prospects?view=refused", icon: XCircle },
    ],
  },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "Paramètres", href: "/settings", icon: Settings },
];

interface SidebarProps {
  todayCount?: number;
}

const Sidebar = ({ todayCount = 0 }: SidebarProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("crm_user");
    toast.success("Déconnexion réussie");
    navigate("/auth");
  };

  const user = JSON.parse(localStorage.getItem("crm_user") || "{}");

  return (
    <div className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-primary">
            <Linkedin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              CRM LinkedIn
            </h1>
            <p className="text-xs text-muted-foreground">Setting Pro</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <div key={item.name}>
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
              {item.name === "Prospects" && todayCount > 0 && (
                <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {todayCount}
                </span>
              )}
            </NavLink>

            {/* Sub-items */}
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

      {/* User profile & logout */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent/50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
            {user.name?.[0] || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
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
