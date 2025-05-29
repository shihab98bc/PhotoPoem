
"use client"

import { useLanguage } from "@/components/providers/language-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Languages } from "lucide-react";

interface LanguageOption {
  value: "en" | "bn";
  label: string;
}

const appLanguages: LanguageOption[] = [
  { value: "en", label: "English" },
  { value: "bn", label: "বাংলা (Bangla)" },
];

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (value: string) => {
    setLanguage(value as "en" | "bn");
  };

  return (
    <div className="flex items-center gap-2">
       <Languages className="h-5 w-5 text-muted-foreground" />
      <Select onValueChange={handleLanguageChange} value={language}>
        <SelectTrigger className="w-[180px] h-10">
          <SelectValue placeholder={t('form.select.language.placeholder')} />
        </SelectTrigger>
        <SelectContent>
          {appLanguages.map((lang) => (
            <SelectItem key={lang.value} value={lang.value}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
