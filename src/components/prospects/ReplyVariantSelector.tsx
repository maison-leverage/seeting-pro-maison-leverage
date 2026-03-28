import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, MessageCircle } from "lucide-react";
import { Prospect } from "@/types/prospect";

interface MessageVariant {
  id: string;
  name: string;
  category: string;
  content: string;
  is_active?: boolean | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  first_dm_inbound: "📩 Premier DM — Inbound",
  first_dm_outbound: "📩 Premier DM — Outbound",
  first_dm_visiteur_profil: "📩 Premier DM — Visiteur Profil",
  first_dm_relation_dormante: "📩 Premier DM — Relation Dormante",
  followup_1: "🔄 Relance 1 (J+4)",
  followup_2: "🔄 Relance 2 (J+10)",
  followup_3: "🔄 Relance 3 (J+15)",
};

const CATEGORY_ORDER = [
  "first_dm_inbound",
  "first_dm_outbound",
  "first_dm_visiteur_profil",
  "first_dm_relation_dormante",
  "followup_1",
  "followup_2",
  "followup_3",
];

interface ReplyVariantSelectorProps {
  prospect: Prospect;
  variants: MessageVariant[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (prospect: Prospect, category: string, variantId: string) => void | Promise<void>;
  buttonLabel?: string;
  className?: string;
}

const ReplyVariantSelector = ({
  prospect,
  variants,
  isOpen,
  onOpenChange,
  onSelect,
  buttonLabel = "Réponse reçue",
  className,
}: ReplyVariantSelectorProps) => {
  const activeVariants = variants
    .filter((variant) => variant.is_active !== false)
    .sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));

  const grouped = activeVariants.reduce<Record<string, MessageVariant[]>>((acc, variant) => {
    if (!acc[variant.category]) acc[variant.category] = [];
    acc[variant.category].push(variant);
    return acc;
  }, {});

  const sortedCategories = CATEGORY_ORDER.filter((category) => grouped[category]?.length > 0);
  Object.keys(grouped).forEach((category) => {
    if (!sortedCategories.includes(category)) sortedCategories.push(category);
  });

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className={className}
          onClick={(event) => event.stopPropagation()}
        >
          <MessageCircle className="w-4 h-4 mr-1" />
          {buttonLabel}
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(92vw,32rem)] p-0" align="start">
        <div className="px-3 py-2 border-b border-border bg-background">
          <p className="text-xs font-medium text-muted-foreground">
            Quel message a déclenché la réponse ?
          </p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-2">
          {sortedCategories.map((category) => (
            <div key={category} className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground px-2 pt-2 pb-1 sticky top-0 bg-background">
                {CATEGORY_LABELS[category] || category}
              </p>

              {grouped[category].map((variant) => (
                <Button
                  key={variant.id}
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start text-sm h-auto py-2 flex-col items-start whitespace-normal"
                  onClick={(event) => {
                    event.stopPropagation();
                    void onSelect(prospect, category, variant.id);
                  }}
                >
                  <span className="font-medium text-left w-full">{variant.name}</span>
                  <span className="text-xs text-muted-foreground text-left w-full whitespace-normal break-words leading-relaxed">
                    {variant.content}
                  </span>
                </Button>
              ))}
            </div>
          ))}

          {sortedCategories.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-3 text-center">
              Aucune variante active dans la bibliothèque.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ReplyVariantSelector;
