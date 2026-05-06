import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Textarea } from "./textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./Dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { useState, useEffect } from "react";
import { Save, X } from "lucide-react";

interface Field {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "date" | "color";
  options?: { value: string; label: string }[];
}

interface EditDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: Field[];
  values: Record<string, string>;
  onSave: (values: Record<string, string>) => void;
  isPending: boolean;
}

export function EditDialog({ open, onClose, title, fields, values, onSave, isPending }: EditDialogProps) {
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) setForm({ ...values });
  }, [open, values]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name} className="space-y-1.5">
              <Label>{field.label}</Label>
              {field.type === "textarea" ? (
                <Textarea
                  value={form[field.name] || ""}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  rows={3}
                />
              ) : field.type === "select" ? (
                <Select value={form[field.name] || ""} onValueChange={(v) => setForm({ ...form, [field.name]: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {field.options?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : field.type === "color" ? (
                <Input type="color" value={form[field.name] || "#3b82f6"} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })} />
              ) : (
                <Input type={field.type} value={form[field.name] || ""} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })} />
              )}
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isPending} className="flex-1">
              <Save className="h-4 w-4 mr-2" />{isPending ? "Saving..." : "Save"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
