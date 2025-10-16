import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, Trophy } from "lucide-react";
import { ABTest } from "@/types/template";
import { toast } from "@/hooks/use-toast";

const TemplateABTests = () => {
  const navigate = useNavigate();
  const [abTests, setAbTests] = useState<ABTest[]>([]);

  useEffect(() => {
    const user = localStorage.getItem("crm_user");
    if (!user) {
      navigate("/auth");
      return;
    }
    loadABTests();
  }, [navigate]);

  const loadABTests = () => {
    const stored = localStorage.getItem("crm_ab_tests");
    if (stored) {
      setAbTests(JSON.parse(stored));
    }
  };

  const ongoingTests = abTests.filter((t) => t.status === "en_cours");
  const completedTests = abTests.filter((t) => t.status === "termine");

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/templates")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  A/B Tests
                </h1>
                <p className="text-muted-foreground mt-1">Testez et optimisez vos templates</p>
              </div>
            </div>
            <Button onClick={() => toast({ title: "Fonctionnalité à venir", description: "La création d'A/B tests sera disponible bientôt" })}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un A/B test
            </Button>
          </div>

          {ongoingTests.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Tests en cours</h2>
              <div className="grid gap-4">
                {ongoingTests.map((test) => (
                  <Card key={test.id} className="p-6 border-border/50 bg-card/50">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{test.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          J{test.currentDay}/{test.duration} • En cours
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Objectif</div>
                        <div className="text-lg font-semibold">{test.targetSends} envois/template</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-4 bg-background/50">
                        <div className="text-sm text-muted-foreground mb-2">TEMPLATE A</div>
                        <div className="text-xs text-muted-foreground">En attente de données...</div>
                      </Card>
                      <Card className="p-4 bg-background/50">
                        <div className="text-sm text-muted-foreground mb-2">TEMPLATE B</div>
                        <div className="text-xs text-muted-foreground">En attente de données...</div>
                      </Card>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {completedTests.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Tests terminés</h2>
              <div className="grid gap-4">
                {completedTests.map((test) => (
                  <Card key={test.id} className="p-6 border-border/50 bg-card/50">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{test.name}</h3>
                        <p className="text-sm text-muted-foreground">Test terminé</p>
                      </div>
                      {test.results && (
                        <div className="flex items-center gap-2 text-yellow-500">
                          <Trophy className="h-5 w-5" />
                          <span className="font-semibold">Gagnant identifié</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {abTests.length === 0 && (
            <Card className="p-12 text-center border-border/50 bg-card/50">
              <div className="max-w-md mx-auto">
                <h3 className="text-xl font-semibold mb-2">Aucun A/B test</h3>
                <p className="text-muted-foreground mb-6">
                  Créez votre premier A/B test pour comparer les performances de vos templates
                </p>
                <Button onClick={() => toast({ title: "Fonctionnalité à venir" })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un A/B test
                </Button>
              </div>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default TemplateABTests;
