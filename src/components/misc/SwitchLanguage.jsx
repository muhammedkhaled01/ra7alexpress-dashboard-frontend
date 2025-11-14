import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { GlobeIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageProvider";

export default function LanguageChange() {
  const { language, changeLanguage } = useLanguage();

  const languages = [
    { code: "en", label: "English" },
    { code: "ar", label: "العربیۃ" },
    { code: "zh", label: "Chineese" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <GlobeIcon className="w-4 h-4" />
          {languages.find((lang) => lang.code === language)?.label || "Language"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`cursor-pointer ${language === lang.code ? "font-bold" : ""
              }`}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
