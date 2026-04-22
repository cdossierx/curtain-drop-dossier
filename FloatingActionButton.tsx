import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
  onClick: () => void;
  label?: string;
}

export function FloatingActionButton({ onClick, label = "Add" }: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className="fixed z-50 rounded-full shadow-lg hover:shadow-xl transition-shadow lg:hidden"
      style={{
        width: "56px",
        height: "56px",
        right: "16px",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)",
      }}
      aria-label={label}
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}
