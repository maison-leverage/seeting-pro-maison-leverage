import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Send, Mail } from "lucide-react";

interface MessageTypeSelectorProps {
  open: boolean;
  onSelect: (type: 'dm' | 'inmail') => void;
  onClose: () => void;
  title?: string;
}

const MessageTypeSelector = ({ open, onSelect, onClose, title = "Type de message" }: MessageTypeSelectorProps) => {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex gap-3">
          <Button
            className="flex-1 h-20 flex-col gap-2 border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
            variant="outline"
            onClick={() => onSelect('dm')}
          >
            <Send className="w-6 h-6" />
            <span className="font-semibold">DM</span>
          </Button>
          <Button
            className="flex-1 h-20 flex-col gap-2 border-amber-300 text-amber-600 hover:bg-amber-50 hover:border-amber-400"
            variant="outline"
            onClick={() => onSelect('inmail')}
          >
            <Mail className="w-6 h-6" />
            <span className="font-semibold">InMail</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageTypeSelector;
