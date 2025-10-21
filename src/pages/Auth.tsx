import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    if (isSignUp && !name) {
      toast.error("Veuillez entrer votre nom");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, name);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Cet email est déjà utilisé");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Compte créé avec succès !");
          navigate("/");
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid")) {
            toast.error("Email ou mot de passe incorrect");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Connexion réussie !");
          navigate("/");
        }
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-background/95 to-primary/5">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-primary">
            <span className="text-2xl">🎯</span>
          </div>
          <CardTitle className="text-3xl font-bold">Neo Prospect</CardTitle>
          <CardDescription className="text-base">
            {isSignUp ? "Créez votre compte" : "Connectez-vous à votre compte"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Nom complet
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-input border-border/50"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input border-border/50"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Mot de passe
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input border-border/50"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 glow-primary"
              disabled={loading}
            >
              {loading ? "Chargement..." : isSignUp ? "Créer un compte" : "Se connecter"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isSignUp ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
