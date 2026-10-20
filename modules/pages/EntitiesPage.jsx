import React from 'react';
import { useTranslation } from 'react-i18next';
import { FolderTree, Network, Users, Share2, Layers, HardDrive } from 'lucide-react';
import EntityTreeView from '../components/EntityTreeView';

const EntitiesPage = () => {
  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-col overflow-y-auto text-on-surface p-2 sm:p-4 lg:p-6 pb-20 md:pb-6 space-y-space-md">
      {/* Top Ambient Glow Gradient Backdrop */}
      <div className="relative w-full">
        <div className="absolute -top-12 left-1/4 w-96 h-48 bg-primary-container/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-0 right-10 w-80 h-36 bg-secondary-container/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header & Breadcrumb */}
        <header className="relative flex flex-col xl:flex-row xl:items-end justify-between gap-space-md pb-space-sm border-b border-white/[0.08]">
          <div className="flex flex-col space-y-space-xs">
            <nav aria-label="breadcrumb" className="flex items-center gap-space-xs font-code-mono text-label-sm text-outline">
              <span className="hover:text-primary transition-colors cursor-pointer">OmniDash</span>
              <span className="text-outline-variant">/</span>
              <span className="hover:text-primary transition-colors cursor-pointer">Tracking & Ops</span>
              <span className="text-outline-variant">/</span>
              <span className="text-primary font-medium">Podmioty & Relacje</span>
            </nav>
            <div className="flex items-baseline gap-space-md flex-wrap">
              <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
                Rejestr Podmiotów, Graf Relacji & Matrix 120m²
              </h1>
              <span className="font-code-mono text-code-mono text-secondary px-space-sm py-0.5 rounded-full bg-secondary-container/30 border border-secondary/20">
                SCHEMA v3.4.1
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
              {t("entitiesDesc", "Wielowymiarowy system kartotek relacyjnych bazujący na grafie powiązań Obsidian. Czasoprzestrzenny rejestr lokacji 120m², psychometryka oraz protokoły wymiany wiedzy.")}
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full text-[11px] font-code-mono bg-secondary-container/20 text-secondary border border-secondary/30">
              [+] OBSIDIAN SYNC: INFORMACJE/OSOBY
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] font-code-mono bg-primary-container/20 text-primary border border-primary/30">
              [+] ENTITIES HUB v3.0.0
            </span>
          </div>
        </header>
      </div>

      {/* Główny komponent widoku drzewa i relacji */}
      <EntityTreeView />
    </div>
  );
};

export default EntitiesPage;
