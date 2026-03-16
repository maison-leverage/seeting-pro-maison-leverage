import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, ChevronDown, ChevronUp, FlaskConical } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface MessageVariant {
  id: string;
  name: string;
  category: string;
  content: string;
  is_control: boolean;
  is_active: boolean;
}

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  first_dm_outbound: { label: "Premier DM Outbound", emoji: "🚀" },
  first_dm_inbound: { label: "Premier DM Inbound", emoji: "📥" },
  first_dm_relation_dormante: { label: "DM Relation Dormante", emoji: "💤" },
  first_dm_visiteur_profil: { label: "DM Visiteur Profil", emoji: "👀" },
  followup_1: { label: "Relance 1", emoji: "🔄" },
  followup_2: { label: "Relance 2", emoji: "🔄" },
  followup_3: { label: "Relance 3", emoji: "🔄" },
};

const replaceVars = (
  content: string,
  vars: { prenom: string; company: string }
): string => {
  let result = content;
  if (vars.prenom) result = result.replace(/\{prenom\}/g, vars.prenom);
  if (vars.company) result = result.replace(/\{company\}/g, vars.company);
  return result;
};

const MessageVariantsCopySection = () => {
  const [variants, setVariants] = useState<MessageVariant[]>([]);
  const [vars, setVars] = useState({ prenom: "", company: "" });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadVariants();
  }, []);

  const loadVariants = async () => {
    const { data, error } = await supabase
      .from("message_variants")
      .select("*")
      .eq("is_active", true)
      .order("category")
      .order("is_control", { ascending: false });

    if (error) {
      console.error("Error loading variants:", error);
      return;
    }
    setVariants(data || []);
    // Open all categories by default
    const cats = new Set((data || []).map((v: MessageVariant) => v.category));
    setOpenCategories(cats);
  };

  const handleCopy = async (variant: MessageVariant) => {
    const finalText = replaceVars(variant.content, vars);
    try {
      await navigator.clipboard.writeText(finalText);
      setCopiedId(variant.id);
      toast({
        title: "Copié !",
        description: `${variant.name} copié dans le presse-papier`,
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de copier",
        variant: "destructive",
      });
    }
  };

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // Group variants by category
  const grouped = variants.reduce<Record<string, MessageVariant[]>>((acc, v) => {
    if (!acc[v.category]) acc[v.category] = [];
    acc[v.category].push(v);
    return acc;
  }, {});

  const categoryOrder = [
    "first_dm_outbound",
    "first_dm_inbound",
    "first_dm_relation_dormante",
    "first_dm_visiteur_profil",
    "followup_1",
    "followup_2",
    "followup_3",
  ];

  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => (categoryOrder.indexOf(a) === -1 ? 99 : categoryOrder.indexOf(a)) -
              (categoryOrder.indexOf(b) === -1 ? 99 : categoryOrder.indexOf(b))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FlaskConical className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Variantes de messages — Copier-coller
          </h2>
          <p className="text-sm text-muted-foreground">
            Remplissez les variables puis copiez directement la variante souhaitée
          </p>
        </div>
      </div>

      {/* Variables inputs */}
      <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="var-prenom">Prénom du prospect</Label>
            <Input
              id="var-prenom"
              value={vars.prenom}
              onChange={(e) => setVars({ ...vars, prenom: e.target.value })}
              placeholder="ex: Marie"
            />
          </div>
          <div>
            <Label htmlFor="var-company">Entreprise</Label>
            <Input
              id="var-company"
              value={vars.company}
              onChange={(e) => setVars({ ...vars, company: e.target.value })}
              placeholder="ex: Acme Corp"
            />
          </div>
        </div>
      </Card>

      {/* Variants grouped by category */}
      {sortedCategories.map((category) => {
        const catInfo = CATEGORY_LABELS[category] || { label: category, emoji: "📝" };
        const catVariants = grouped[category];
        const isOpen = openCategories.has(category);

        return (
          <Collapsible key={category} open={isOpen} onOpenChange={() => toggleCategory(category)}>
            <CollapsibleTrigger asChild>
              <Card className="p-4 cursor-pointer hover:bg-accent/50 transition-colors border-border/50 bg-card/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{catInfo.emoji}</span>
                    <h3 className="font-semibold text-foreground">{catInfo.label}</h3>
                    <Badge variant="outline" className="text-xs">
                      {catVariants.length} variante{catVariants.length > 1 ? "s" : ""}
                    </Badge>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
                {catVariants.map((variant) => {
                  const isCopied = copiedId === variant.id;
                  const finalText = replaceVars(variant.content, vars);

                  return (
                    <Card
                      key={variant.id}
                      className={`p-4 border-border/50 bg-card/50 backdrop-blur-sm ${
                        variant.is_control
                          ? "ring-1 ring-primary/30"
                          : "ring-1 ring-orange-500/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground">{variant.name}</h4>
                          <Badge
                            variant={variant.is_control ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {variant.is_control ? "Control" : "Challenger"}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleCopy(variant)}
                          disabled={isCopied}
                          className="shrink-0"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Copié !
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-1" />
                              Copier
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="p-3 rounded-md bg-muted/50 border border-border/30 whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                        {finalText}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}

      {variants.length === 0 && (
        <Card className="p-8 text-center border-border/50 bg-card/50">
          <p className="text-muted-foreground">Aucune variante de message trouvée</p>
        </Card>
      )}
    </div>
  );
};

export default MessageVariantsCopySection;
