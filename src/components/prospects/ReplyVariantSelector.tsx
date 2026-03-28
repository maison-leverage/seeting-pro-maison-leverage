import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, MessageCircle } from "lucide-react";
import { Prospect } from "@/types/prospect";

interface MessageVariant {
  id: string;
  name: string;
  category: string;
  content: string;
  is_control: boolean;
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

// Order for display
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
  onSelect: (prospect: Prospect, category: string, variantId: string) => void;
  buttonLabel?: string;
}

const ReplyVariantSelector = ({
  prospect,
  variants,
  isOpen,
  onOpenChange,
  onSelect,
  buttonLabel = "Réponse reçue",
}: ReplyVariantSelectorProps) => {
  // Group active variants by category
  const activeVariants = variants.filter(v => v.is_control !== undefined); // all variants
  const grouped: Record<string, MessageVariant[]> = {};

  activeVariants.forEach(v => {
    if (!grouped[v.category]) grouped[v.category] = [];
    grouped[v.category].push(v);
  });

  // Sort categories by defined order
  const sortedCategories = CATEGORY_ORDER.filter(cat => grouped[cat]?.length > 0);
  // Add any categories not in the predefined order
  Object.keys(grouped).forEach(cat => {
    if (!sortedCategories.includes(cat)) sortedCategories.push(cat);
  });

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="border-yellow-300 text-yellow-600 hover:bg-yellow-50">
          <MessageCircle className="w-4 h-4 mr-1" /> {buttonLabel} <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="px-3 py-2 border-b border-border">
          <p className="text-xs font-medium text-muted-foreground">Quel message a déclenché la réponse ?</p>
        </div>
        <ScrollArea className="max-h-[400px]">
          <div className="p-2 space-y-1">
            {sortedCategories.map(category => (
              <div key={category}>
                <p className="text-xs font-semibold text-muted-foreground px-2 pt-2 pb-1">
                  {CATEGORY_LABELS[category] || category}
                </p>
                {grouped[category].map(variant => (
                  <Button
                    key={variant.id}
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start text-sm h-auto py-2 flex-col items-start"
                    onClick={() => onSelect(prospect, category, variant.id)}
                  >
                    <span className="font-medium">{variant.name}</span>
                    <span className="text-xs text-muted-foreground truncate w-full text-left">
                      {variant.content.substring(0, 80)}…
                    </span>
                  </Button>
                ))}
              </div>
            ))}
            {sortedCategories.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-3 text-center">
                Aucune variante dans la bibliothèque.
              </p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default ReplyVariantSelector;
