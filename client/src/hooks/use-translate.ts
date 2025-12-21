import { useLanguage } from '@/contexts/language-context';
import { t } from '@/lib/translations';

export function useTranslate() {
  const { language } = useLanguage();
  
  return (key: string): string => {
    return t(key, language);
  };
}
