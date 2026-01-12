import { useState } from "react";
import { Prospect } from "@/types/prospect";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DuplicateGroup {
  key: string;
  type: "linkedin" | "name_company";
  prospects: Prospect[];
}

interface DuplicateDetectorProps {
  prospects: Prospect[];
  onEdit: (prospect: Prospect) => void;
}

const DuplicateDetector = ({ prospects, onEdit }: DuplicateDetectorProps) => {
  const [open, setOpen] = useState(false);

  const findDuplicates = (): DuplicateGroup[] => {
    const duplicates: DuplicateGroup[] = [];

    // 1. Chercher les doublons par URL LinkedIn
    const linkedinMap = new Map<string, Prospect[]>();
    prospects.forEach((p) => {
      if (p.linkedinUrl && p.linkedinUrl.trim() !== "") {
        // Normaliser l'URL LinkedIn
        const normalizedUrl = p.linkedinUrl
          .toLowerCase()
          .replace(/\/$/, "") // Enlever le slash final
          .replace(/^https?:\/\/(www\.)?/, ""); // Enlever le protocole

        const existing = linkedinMap.get(normalizedUrl) || [];
        existing.push(p);
        linkedinMap.set(normalizedUrl, existing);
      }
    });

    linkedinMap.forEach((group, url) => {
      if (group.length > 1) {
        duplicates.push({
          key: url,
          type: "linkedin",
          prospects: group,
        });
      }
    });

    // 2. Chercher les doublons par Nom + Entreprise
    const nameCompanyMap = new Map<string, Prospect[]>();
    prospects.forEach((p) => {
      const key = `${p.fullName.toLowerCase().trim()}|${p.company.toLowerCase().trim()}`;
      const existing = nameCompanyMap.get(key) || [];
      existing.push(p);
      nameCompanyMap.set(key, existing);
    });

    nameCompanyMap.forEach((group, key) => {
      if (group.length > 1) {
        // Éviter les doublons déjà trouvés par LinkedIn
        const alreadyFound = duplicates.some((d) =>
          d.prospects.some((dp) => group.some((gp) => gp.id === dp.id))
        );
        if (!alreadyFound) {
          duplicates.push({
            key,
            type: "name_company",
            prospects: group,
          });
        }
      }
    });

    return duplicates;
  };

  const duplicates = findDuplicates();
  const totalDuplicates = duplicates.reduce((acc, d) => acc + d.prospects.length - 1, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={`gap-2 ${totalDuplicates > 0 ? "border-amber-500 text-amber-700 hover:bg-amber-50" : ""}`}
        >
          <Copy className="w-4 h-4" />
          Doublons
          {totalDuplicates > 0 && (
            <Badge variant="destructive" className="ml-1 bg-amber-500 hover:bg-amber-600">
              {totalDuplicates}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Détection de doublons
          </DialogTitle>
        </DialogHeader>

        {duplicates.length === 0 ? (
          <div className="py-8 text-center">
            <div className="text-4xl mb-4">✅</div>
            <p className="text-lg font-medium text-foreground">Aucun doublon détecté</p>
            <p className="text-muted-foreground mt-2">
              Tous vos prospects sont uniques
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[500px] pr-4">
            <div className="space-y-6">
              <p className="text-muted-foreground">
                <span className="font-semibold text-amber-600">{totalDuplicates}</span> doublon(s) trouvé(s) dans{" "}
                <span className="font-semibold">{duplicates.length}</span> groupe(s)
              </p>

              {duplicates.map((group, index) => (
                <div
                  key={`${group.type}-${index}`}
                  className="border border-border rounded-lg p-4 bg-card"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Badge
                      variant="outline"
                      className={
                        group.type === "linkedin"
                          ? "border-blue-500 text-blue-700 bg-blue-50"
                          : "border-purple-500 text-purple-700 bg-purple-50"
                      }
                    >
                      {group.type === "linkedin" ? "URL LinkedIn identique" : "Nom + Entreprise identiques"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {group.prospects.length} occurrences
                    </span>
                  </div>

                  <div className="space-y-2">
                    {group.prospects.map((prospect) => (
                      <div
                        key={prospect.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-md hover:bg-muted transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{prospect.fullName}</p>
                          <p className="text-sm text-muted-foreground">
                            {prospect.company}
                            {prospect.position && ` • ${prospect.position}`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Créé le {new Date(prospect.createdAt).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {prospect.linkedinUrl && (
                            <a
                              href={prospect.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              onEdit(prospect);
                              setOpen(false);
                            }}
                          >
                            Modifier
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateDetector;
