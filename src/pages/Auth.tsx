import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Linkedin, Lock, Mail } from "lucide-react";

const USERS = [
  { id: "1", email: "toi@crm.com", password: "admin123", name: "Toi" },
  { id: "2", email: "oceane@crm.com", password: "admin123", name: "Océane" },
];

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const user = USERS.find(
        (u) => u.email === email && u.password === password
      );

      if (user) {
        localStorage.setItem("crm_user", JSON.stringify(user));
        toast.success(`Bienvenue ${user.name} ! 👋`);
        navigate("/");
      } else {
        toast.error("Email ou mot de passe incorrect");
      }
      setLoading(false);
    }, 800);
  };

  const quickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword("admin123");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      <div className="absolute inset-0" style={{ backgroundImage: 'var(--gradient-glow)' }} />

      <div className="relative z-10 w-full max-w-md p-8 mx-4">
        <div className="glass rounded-2xl p-8 shadow-2xl border border-border/50 animate-fade-in">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-4 glow-primary">
              <Linkedin className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              CRM LinkedIn
            </h1>
            <p className="text-muted-foreground mt-2">
              Connecte-toi pour gérer tes prospects
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/90">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@email.com"
                  className="pl-10 bg-input border-border/50 focus:border-primary transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/90">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 bg-input border-border/50 focus:border-primary transition-all"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-lg hover:shadow-xl glow-primary"
              disabled={loading}
            >
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          {/* Quick login */}
          <div className="mt-8 pt-6 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-3 text-center">
              Connexion rapide :
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => quickLogin("toi@crm.com")}
                className="border-border/50 hover:border-primary hover:bg-primary/10 transition-all"
              >
                👤 Toi
              </Button>
              <Button
                variant="outline"
                onClick={() => quickLogin("oceane@crm.com")}
                className="border-border/50 hover:border-secondary hover:bg-secondary/10 transition-all"
              >
                👤 Océane
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Mot de passe : admin123
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          CRM moderne pour setting LinkedIn
        </p>
      </div>
    </div>
  );
};

export default Auth;
