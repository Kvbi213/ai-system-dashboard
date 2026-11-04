import React, { useState } from 'react';
import { Network } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { EntityTreeView } from './components/EntityTreeView';
import { EntityDetailsModal, EntityItem } from './components/EntityDetailsModal';
import { useToast } from '../../components/ui/Toast';

const INITIAL_ENTITIES: EntityItem[] = [
  {
    id: 'ent_matrix_120m2',
    name: 'Matrix 120m² (Posiadłość & Strych)',
    type: 'ASSET',
    role: 'Centralna baza operacyjna i strefa treningowa',
    category: 'Majątek & Infrastruktura',
    location: 'Sektor Domowy / Strych FBW',
    relations: ['Jakub Lis (Właściciel)', 'Stanowisko Desktop W11', 'Drążek & Dipy'],
    notes: 'Strefa kalisteniki, sprzęt komputerowy, węzeł sieci lokalnej i laboratorium hardware.',
    obsidianPath: 'OBSIDIAN/PROJEKTY/OmniDash_AI_Dashboard/Matrix_120m2.md',
    status: 'ACTIVE'
  },
  {
    id: 'ent_operator',
    name: 'Jakub Lis (Operator)',
    type: 'PERSON',
    role: 'Principal Engineer & Główny Użytkownik',
    category: 'Podmiot Kluczowy',
    location: 'Polska',
    relations: ['Matrix 120m²', 'ZSE Zduńska Wola', 'Mikr.us VPS'],
    notes: 'Konto administratora systemowego OmniDash v4.0. Uprawnienia Root i Zero-Trust.',
    obsidianPath: 'OBSIDIAN/PROJEKTY/OmniDash_AI_Dashboard/Operator.md',
    status: 'ACTIVE'
  },
  {
    id: 'ent_zse',
    name: 'ZSE - Technik Informatyk',
    type: 'ORGANIZATION',
    role: 'Szkoła średnia (Klasa 2 TI)',
    category: 'Edukacja & Rozwój',
    location: 'Zduńska Wola',
    relations: ['Jakub Lis (Uczeń)', 'Librus Synergia', 'Pracownia UTK / SO'],
    notes: 'Harmonogram 34 godzin lekcyjnych tygodniowo, pracownie systemowe, egzaminy zawodowe INF.02.',
    obsidianPath: 'OBSIDIAN/PROJEKTY/OmniDash_AI_Dashboard/ZSE_Informatyka.md',
    status: 'ACTIVE'
  },
  {
    id: 'ent_mikrus',
    name: 'Mikr.us VPS Node (LXC)',
    type: 'SYSTEM',
    role: 'Węzeł serwerowy chmury prywatnej',
    category: 'Infrastruktura Serwerowa',
    location: 'Cloud VPS Mikrus',
    relations: ['OmniDash API Gateway', 'Docker Engine', 'Kopia SQLite WAL'],
    notes: 'Uruchomione kontenery serwisowe, reverse-proxy Caddy, monitoring i log drain.',
    obsidianPath: 'OBSIDIAN/PROJEKTY/OmniDash_AI_Dashboard/Infrastruktura_Mikrus.md',
    status: 'ACTIVE'
  },
  {
    id: 'ent_pushbullet',
    name: 'Pushbullet Cloud Dispatcher',
    type: 'SYSTEM',
    role: 'Magistrala powiadomień mobilnych',
    category: 'Telefonia & Komunikacja',
    relations: ['Smartfon Pixel', 'OmniDash Worker', 'Alerty CANARD'],
    notes: 'Wielopoziomowy dispatcher powiadomień Push, webhooki bankowe i notatki z telefonu.',
    obsidianPath: 'OBSIDIAN/PROJEKTY/OmniDash_AI_Dashboard/Pushbullet_Dispatcher.md',
    status: 'ACTIVE'
  },
  {
    id: 'ent_librus',
    name: 'Librus Synergia API',
    type: 'SYSTEM',
    role: 'Zewnętrzny system e-dziennika',
    category: 'Edukacja & Dane Zewnętrzne',
    relations: ['ZSE - Technik Informatyk', 'Plan Lekcji', 'Oceny i Frekwencja'],
    notes: 'Autorytatywne źródło planu lekcji, ocen i terminarza sprawdzianów.',
    obsidianPath: 'OBSIDIAN/PROJEKTY/OmniDash_AI_Dashboard/Librus_Synergia.md',
    status: 'ACTIVE'
  }
];

export const EntitiesPage: React.FC = () => {
  const [entities] = useState<EntityItem[]>(INITIAL_ENTITIES);
  const [selectedEntity, setSelectedEntity] = useState<EntityItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Zsynchronizowano rejestr encji z bazą wiedzy Obsidian');
    }, 400);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <PageHeader
        icon={Network}
        title="Baza Wiedzy & Rejestr Podmiotów"
        subtitle="Graf powiązań osób, organizacji, majątku Matrix 120m² i systemów"
        badge="Obsidian Sync v4.0"
        badgeVariant="sky"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        refreshLabel="Synchronizuj"
      />

      <EntityTreeView
        entities={entities}
        onSelectEntity={setSelectedEntity}
      />

      <EntityDetailsModal
        entity={selectedEntity}
        onClose={() => setSelectedEntity(null)}
      />
    </div>
  );
};
