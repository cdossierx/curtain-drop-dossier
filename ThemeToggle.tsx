import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    const dark = root.classList.contains("dark");
    setIsDark(dark);
  }, []);

  const toggle = () => {
    const root = window.document.documentElement;
    root.classList.toggle("dark");
    setIsDark(!isDark);
  };

  return (
    <Button variant="outline" size="icon" onClick={toggle}>
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
