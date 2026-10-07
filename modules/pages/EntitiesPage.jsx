import React from 'react';
import { useTranslation } from 'react-i18next';
import { FolderTree, Network } from 'lucide-react';
import EntityTreeView from '../components/EntityTreeView';

const EntitiesPage = () => {
  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-col overflow-hidden text-textPrimary animate-soft-enter p-2 sm:p-4 pb-20 md:pb-4">
      {/* Header */}
      <header className="glass-panel p-4 sm:p-5 rounded-xl border border-border flex items-center justify-between gap-3 sm:gap-4 mb-4 shrink-0 opacity-0 animate-soft-enter" style={{ animationDelay: '50ms' }}>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center flex-shrink-0 shadow-sm">
            <FolderTree className="w-5 h-5 text-accentPrimary" />
          </div>
          <div className="flex flex-col">
            <nav aria-label="breadcrumb" className="flex items-center space-x-2 text-sm text-textMuted mb-0.5">
              <span className="flex items-center text-base sm:text-lg font-medium text-textMuted/70">OmniDash</span>
              <span className="shrink-0 text-base sm:text-lg font-medium text-textMuted/70">/</span>
              <span className="flex items-center text-base sm:text-lg font-medium text-textMuted/70">Baza Wiedzy</span>
              <span className="shrink-0 text-base sm:text-lg font-medium text-textMuted/70">/</span>
              <span className="flex items-center text-base sm:text-lg font-medium text-textPrimary">Podmioty & Relacje</span>
            </nav>
            <p className="font-sans text-xs text-textMuted mt-0.5">
              {t("entitiesDesc", "Drzewo hierarchii pochodzenia, relacje sieciowe podmiotów i wywiad OSINT")}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-accentSecondary/10 text-accentSecondary border border-accentSecondary/30">
            [+] OBSIDIAN SYNC: INFORMACJE/OSOBY
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-accentPrimary/10 text-accentPrimary border border-accentPrimary/30">
            [+] ENTITIES HUB v2.32.0
          </span>
        </div>
      </header>

      {/* Główny komponent widoku drzewa */}
      <EntityTreeView />
    </div>
  );
};

export default EntitiesPage;
