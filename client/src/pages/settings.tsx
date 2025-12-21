import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/language-context";
import { useTranslate } from "@/hooks/use-translate";
import { toast } from "@/hooks/use-toast";
import type { LanguageCode } from "@/lib/translations";

export default function Settings() {
  const { language, setLanguage } = useLanguage();
  const t = useTranslate();

  const handleLanguageChange = (newLang: LanguageCode) => {
    setLanguage(newLang);
    toast({ title: t('settings.languagechanged') });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
          {t('settings.title')}
        </h2>
        <p className="text-muted-foreground mt-1">{t('settings.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('settings.language')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language" className="text-sm">
              {t('settings.selectlanguage')}
            </Label>
            <Select value={language} onValueChange={(v) => handleLanguageChange(v as LanguageCode)}>
              <SelectTrigger id="language" className="w-[200px]" data-testid="select-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t('settings.english')}</SelectItem>
                <SelectItem value="id">{t('settings.indonesian')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
