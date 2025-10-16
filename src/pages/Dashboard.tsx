import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import {
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  Target,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Prospect } from "@/types/prospect";

const Dashboard = () => {
  const navigate = useNavigate();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    // Check auth
    const user = localStorage.getItem("crm_user");
    if (!user) {
      navigate("/auth");
      return;
    }

    // Load prospects from localStorage
    const stored = localStorage.getItem("crm_prospects");
    if (stored) {
      const loadedProspects = JSON.parse(stored);
      setProspects(loadedProspects);

      // Calculate today count
      const today = new Date().toISOString().split("T")[0];
      const count = loadedProspects.filter(
        (p: Prospect) =>
          p.reminderDate && p.reminderDate.split("T")[0] <= today
      ).length;
      setTodayCount(count);
    }
  }, [navigate]);

  const stats = [
    {
      label: "Total prospects",
      value: prospects.length,
      icon: Users,
      color: "from-primary to-secondary",
      glow: "glow-primary",
    },
    {
      label: "À relancer aujourd'hui",
      value: todayCount,
      icon: Clock,
      color: "from-destructive to-warning",
      glow: "glow-secondary",
    },
    {
      label: "Prospects qualifiés",
      value: prospects.filter((p) => p.qualification === "qualifie").length,
      icon: CheckCircle2,
      color: "from-success to-primary",
    },
    {
      label: "En discussion",
      value: prospects.filter(
        (p) => p.status === "discussion" || p.status === "qualifie"
      ).length,
      icon: TrendingUp,
      color: "from-warning to-success",
    },
    {
      label: "Taux de conversion",
      value:
        prospects.length > 0
          ? `${Math.round(
              (prospects.filter((p) => p.status === "gagne").length /
                prospects.length) *
                100
            )}%`
          : "0%",
      icon: Target,
      color: "from-secondary to-primary",
    },
    {
      label: "Score moyen",
      value:
        prospects.length > 0
          ? Math.round(
              prospects.reduce((acc, p) => acc + p.score, 0) / prospects.length
            )
          : 0,
      icon: Zap,
      color: "from-primary to-warning",
    },
  ];

  const topProspects = [...prospects]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar todayCount={todayCount} />
      <div className="flex-1 ml-64">
        <Header notificationCount={todayCount} />

        <main className="p-6 space-y-6 animate-fade-in">
          {/* Welcome */}
          <div className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-primary/20 via-background to-secondary/20 border border-primary/20">
            <div className="absolute inset-0" style={{ backgroundImage: "var(--gradient-glow)" }} />
            <div className="relative z-10">
              <h1 className="text-3xl font-bold mb-2">
                Bienvenue sur ton CRM LinkedIn 👋
              </h1>
              <p className="text-muted-foreground">
                Gérer tes prospects n'a jamais été aussi simple et addictif
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className={`p-6 border-border/50 hover:border-primary/50 transition-all hover-scale cursor-pointer ${
                  stat.glow || ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                  >
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Top Prospects */}
          <Card className="p-6 border-border/50">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" />
              Top 5 prospects à traiter en priorité
            </h2>
            {topProspects.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucun prospect pour le moment. Commence par en ajouter ! 🚀
              </p>
            ) : (
              <div className="space-y-3">
                {topProspects.map((prospect) => (
                  <div
                    key={prospect.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-card-hover border border-border/50 hover:border-primary/50 transition-all cursor-pointer hover-scale"
                    onClick={() => navigate(`/prospects?edit=${prospect.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                        {prospect.fullName.split(" ").slice(0, 2).map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-medium">
                          {prospect.fullName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {prospect.position} chez {prospect.company}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {prospect.score}
                      </div>
                      <p className="text-xs text-muted-foreground">Score</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
