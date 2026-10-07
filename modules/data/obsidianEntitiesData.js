import bundle from '../../data/obsidian_starter_bundle.json';

export const STARTER_TREE_DATA = bundle.tree || [];
export const STARTER_ASCII = bundle.ascii || '';
export const STARTER_STATS = bundle.stats || { total: 0, byType: {} };
export const FALLBACK_NODES = bundle.fallbackNodes || {};
export const FALLBACK_RELATIONS = bundle.allRelations || {};

export const DOMAIN_MODULES_CONFIG = [
  { key: 'metryka', label: 'Metryka & ID', tag: '[ID]', icon: 'UserCheck', desc: 'Identyfikacja, daty, lokacja' },
  { key: 'charakter', label: 'Charakter & Psychologia', tag: '[PSYCH]', icon: 'Brain', desc: 'Styl myślenia, Clean Tactical, cechy' },
  { key: 'sociale', label: 'Cyber-Ślad & Sociale', tag: '[SOC]', icon: 'Globe', desc: 'Telefon, Discord, GitHub, Steam' },
  { key: 'zdrowie', label: 'Zdrowie & Biometria', tag: '[BIO]', icon: 'HeartPulse', desc: 'Kalistenika, Clean Focus, sen' },
  { key: 'finanse', label: 'Finanse & Budżet', tag: '[FIN]', icon: 'Wallet', desc: 'Model 120m², wiarygodność, rozliczenia' },
  { key: 'zainteresowania', label: 'Pasje & Tech', tag: '[TECH]', icon: 'Gamepad2', desc: 'Systemy, motoryzacja, gaming, alchemia' },
  { key: 'rutyna', label: 'Rutyna & Czas', tag: '[TIME]', icon: 'Clock', desc: 'Okna Deep Work, zasada do 19:00' },
  { key: 'relacja', label: 'Historia Więzi', tag: '[REL]', icon: 'HeartHandshake', desc: 'Fundament relacji, granice, zasady' },
  { key: 'siec_relacji', label: 'Środowisko & Zespół', tag: '[NET]', icon: 'Users', desc: 'Pozycja w grupie, układ 2 par' },
  { key: 'zaufanie_i_ryzyka', label: 'Filtry Zaufania & Ryzyka', tag: '[RISK]', icon: 'ShieldAlert', desc: 'Red Flags, Green Flags, audyt' }
];

export const HOUSING_STATUS_BADGE = {
  'Core': 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10',
  'Współlokator': 'border-blue-500/50 text-blue-400 bg-blue-500/10',
  'Gość': 'border-purple-500/50 text-purple-400 bg-purple-500/10',
  'Rezerwa': 'border-amber-500/50 text-amber-400 bg-amber-500/10',
  'Brak kwalifikacji': 'border-rose-500/50 text-rose-400 bg-rose-500/10'
};
