import { 
  Cpu, Zap, Lock, Shield, Rss, Code, Smartphone, Cloud, 
  Terminal, Server, Gamepad2, Database, Rocket, HeartPulse, 
  Car, Glasses, Globe, Briefcase, TrendingUp, Music, 
  Film, Plane, Book, Wrench, Sprout, Landmark
} from 'lucide-react';

export const COLOR_PRESETS = [
  { name: 'Neon Green', rgb: '0 255 102', hex: '#00FF66' },
  { name: 'Cyber Blue', rgb: '0 229 255', hex: '#00E5FF' },
  { name: 'Deep Cyan', rgb: '0 184 212', hex: '#00B8D4' },
  { name: 'Matrix Purple', rgb: '170 0 255', hex: '#AA00FF' },
  { name: 'Amethyst', rgb: '156 39 176', hex: '#9C27B0' },
  { name: 'Fuchsia', rgb: '255 0 255', hex: '#FF00FF' },
  { name: 'Rose Pink', rgb: '255 0 170', hex: '#FF00AA' },
  { name: 'Crimson Red', rgb: '220 20 60', hex: '#DC143C' },
  { name: 'Alert Red', rgb: '255 51 102', hex: '#FF3366' },
  { name: 'Sunset Orange', rgb: '255 87 34', hex: '#FF5722' },
  { name: 'Warning Orange', rgb: '255 153 0', hex: '#FF9900' },
  { name: 'Solar Gold', rgb: '255 193 7', hex: '#FFC107' },
  { name: 'Emerald', rgb: '46 204 113', hex: '#2ECC71' },
];

export const NEWS_CATEGORIES = [
  // IT & TECH
  { id: 'ai', label: 'AI & LLM', icon: Cpu, query: 'artificial intelligence LLM GPT 2026', color: '#00FF66', desc: 'Modele językowe, agenty, AI', section: 'IT & Tech' },
  { id: 'hardware', label: 'Sprzęt IT', icon: Zap, query: 'GPU CPU chip hardware tech 2026', color: '#00E5FF', desc: 'GPU, CPU, sprzęt', section: 'IT & Tech' },
  { id: 'jailbreak', label: 'Jailbreaki AI', icon: Lock, query: 'AI jailbreak LLM bypass prompt injection 2026', color: '#AA00FF', desc: 'Obejścia, podatności AI', section: 'IT & Tech' },
  { id: 'security', label: 'CyberSec', icon: Shield, query: 'cybersecurity hacking exploit vulnerability white hat 2026', color: '#FF3366', desc: 'Hakowanie, CVE, bezpieczeństwo', section: 'IT & Tech' },
  { id: 'opensource', label: 'Open Source', icon: Rss, query: 'open source github release linux 2026', color: '#FF9900', desc: 'Społeczność, projekty GitHub', section: 'IT & Tech' },
  { id: 'webdev', label: 'Web Development', icon: Code, query: 'web development react vue javascript frontend backend', color: '#38bdf8', desc: 'Frontend, Backend, Frameworki', section: 'IT & Tech' },
  { id: 'mobile', label: 'Mobile App', icon: Smartphone, query: 'mobile app development ios android swift kotlin', color: '#a855f7', desc: 'iOS, Android, React Native', section: 'IT & Tech' },
  { id: 'cloud', label: 'Cloud & DevOps', icon: Cloud, query: 'aws azure gcp docker kubernetes devops', color: '#3b82f6', desc: 'Chmura, k8s, serwery', section: 'IT & Tech' },
  { id: 'blockchain', label: 'Blockchain', icon: Database, query: 'blockchain crypto web3 bitcoin ethereum', color: '#f59e0b', desc: 'Kryptowaluty, Web3, Smart Kontrakty', section: 'IT & Tech' },
  { id: 'gamedev', label: 'GameDev', icon: Gamepad2, query: 'game development unreal engine unity gaming industry', color: '#ef4444', desc: 'Tworzenie gier, silniki', section: 'IT & Tech' },
  { id: 'datascience', label: 'Data Science', icon: Server, query: 'data science machine learning python statistics big data', color: '#10b981', desc: 'Big Data, analiza danych', section: 'IT & Tech' },
  
  // NAUKA I BIZNES
  { id: 'startups', label: 'Startupy', icon: Rocket, query: 'startup funding vc tech entrepreneurship', color: '#ec4899', desc: 'Biznes, inwestycje, innowacje', section: 'Świat i Nauka' },
  { id: 'economy', label: 'Gospodarka', icon: TrendingUp, query: 'economy finance stock market inflation', color: '#14b8a6', desc: 'Rynki finansowe, inflacja', section: 'Świat i Nauka' },
  { id: 'politics', label: 'Polityka', icon: Landmark, query: 'global politics news elections policy', color: '#64748b', desc: 'Wybory, polityka międzynarodowa', section: 'Świat i Nauka' },
  { id: 'worldnews', label: 'Świat', icon: Globe, query: 'world news global events breaking', color: '#0ea5e9', desc: 'Najważniejsze wydarzenia', section: 'Świat i Nauka' },
  { id: 'space', label: 'Kosmos', icon: Globe, query: 'space exploration nasa spacex astronomy', color: '#8b5cf6', desc: 'Eksploracja kosmosu', section: 'Świat i Nauka' },
  { id: 'medtech', label: 'Medycyna', icon: HeartPulse, query: 'health medicine biotech medical technology', color: '#f43f5e', desc: 'Zdrowie i technologie medyczne', section: 'Świat i Nauka' },
  { id: 'ecology', label: 'Ekologia', icon: Sprout, query: 'climate change green energy ecology environment', color: '#22c55e', desc: 'OZE, klimat, ochrona środowiska', section: 'Świat i Nauka' },
  { id: 'robotics', label: 'Robotyka', icon: Wrench, query: 'robotics automation boston dynamics robots', color: '#d946ef', desc: 'Roboty, automatyzacja', section: 'Świat i Nauka' },

  // LIFESTYLE
  { id: 'sports', label: 'Sport', icon: Briefcase, query: 'sports football basketball tennis athletics', color: '#f97316', desc: 'Wydarzenia sportowe', section: 'Rozrywka i Lifestyle' },
  { id: 'movies', label: 'Filmy & Seriale', icon: Film, query: 'movies cinema netflix hbo entertainment', color: '#eab308', desc: 'Kino, nowości VOD', section: 'Rozrywka i Lifestyle' },
  { id: 'music', label: 'Muzyka', icon: Music, query: 'music industry album release concerts', color: '#6366f1', desc: 'Nowe albumy, koncerty', section: 'Rozrywka i Lifestyle' },
  { id: 'travel', label: 'Podróże', icon: Plane, query: 'travel tourism destinations flights', color: '#06b6d4', desc: 'Turystyka, porady', section: 'Rozrywka i Lifestyle' },
  { id: 'books', label: 'Książki', icon: Book, query: 'books literature publishing authors', color: '#84cc16', desc: 'Literatura, nowości', section: 'Rozrywka i Lifestyle' },
  { id: 'auto', label: 'Motoryzacja', icon: Car, query: 'automotive cars electric vehicles ev', color: '#94a3b8', desc: 'Samochody, branża EV', section: 'Rozrywka i Lifestyle' },
  { id: 'arvr', label: 'AR & VR', icon: Glasses, query: 'augmented reality virtual reality apple vision oculus', color: '#c026d3', desc: 'Wirtualna rzeczywistość', section: 'Rozrywka i Lifestyle' },
];

export const CATEGORY_CONFIG = NEWS_CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = cat;
  return acc;
}, {});
