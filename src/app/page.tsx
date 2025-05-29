
"use client";

import PhotoPoemForm from '@/components/PhotoPoemForm';
import { Camera } from 'lucide-react';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useLanguage } from '@/components/providers/language-provider';
import { useEffect, useState } from 'react';

export default function Home() {
  const { t } = useLanguage();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="bg-card shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="h-8 w-8 text-primary" />
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
              {t('header.title')}
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageSwitcher />
            <ThemeToggleButton />
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 md:px-6 py-8 md:py-12">
        <PhotoPoemForm />
      </main>
      <footer className="bg-card shadow-sm py-6 mt-auto">
        <div className="container mx-auto px-4 md:px-6 text-center text-sm text-muted-foreground">
          <p>{t('footer.copyright', { year: currentYear })}</p>
        </div>
      </footer>
    </div>
  );
}
