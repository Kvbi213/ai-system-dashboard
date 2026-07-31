import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  pl: {
    translation: {
      "dashboard": "Dashboard",
      "terminal": "AI Terminal",
      "memory": "Pamięć",
      "webSearch": "Web Search",
      "osint": "OSINT",
      "calendar": "Kalendarz",
      "finances": "Finanse",
      "workouts": "Treningi",
      "widgets": "Widżety",
      "settings": "Ustawienia",
      "welcome": "Witaj w OmniDash",
      "setupTitle": "Konfiguracja Początkowa",
      "setupLanguage": "Wybierz język systemu",
      "language_pl": "Polski (PL)",
      "language_en": "Angielski (EN)",
      "language_uk": "Ukraiński (UK)",
      "language_zh": "Mandaryński (ZH)",
      "save": "Zapisz",
      "cancel": "Anuluj",
      "languageSettings": "Język i Region",
      "generalSettings": "Ustawienia Ogólne",
      "statusNominal": "Status: Nominal",
      "openWidgetCatalog": "Otwórz Katalog Widżetów",
      "authTitle": "Autoryzacja",
      "authSubtitle": "Wprowadź kod dostępu, aby odblokować OmniDash.",
      "invalidPin": "Nieprawidłowy kod PIN.",
      "verifying": "Weryfikacja...",
      "unlock": "Odblokuj"
    }
  },
  en: {
    translation: {
      "dashboard": "Dashboard",
      "terminal": "AI Terminal",
      "memory": "Memory",
      "webSearch": "Web Search",
      "osint": "OSINT",
      "calendar": "Calendar",
      "finances": "Finances",
      "workouts": "Workouts",
      "widgets": "Widgets",
      "settings": "Settings",
      "welcome": "Welcome to OmniDash",
      "setupTitle": "Initial Setup",
      "setupLanguage": "Choose system language",
      "language_pl": "Polish (PL)",
      "language_en": "English (EN)",
      "language_uk": "Ukrainian (UK)",
      "language_zh": "Mandarin (ZH)",
      "save": "Save",
      "cancel": "Cancel",
      "languageSettings": "Language and Region",
      "generalSettings": "General Settings",
      "statusNominal": "Status: Nominal",
      "openWidgetCatalog": "Open Widget Catalog",
      "authTitle": "Authorization",
      "authSubtitle": "Enter your passcode to unlock OmniDash.",
      "invalidPin": "Invalid PIN code.",
      "verifying": "Verifying...",
      "unlock": "Unlock"
    }
  },
  uk: {
    translation: {
      "dashboard": "Дашборд",
      "terminal": "ШІ Термінал",
      "memory": "Пам'ять",
      "webSearch": "Пошук в мережі",
      "osint": "OSINT",
      "calendar": "Календар",
      "finances": "Фінанси",
      "workouts": "Тренування",
      "widgets": "Віджети",
      "settings": "Налаштування",
      "welcome": "Ласкаво просимо до OmniDash",
      "setupTitle": "Початкове налаштування",
      "setupLanguage": "Оберіть мову системи",
      "language_pl": "Польська (PL)",
      "language_en": "Англійська (EN)",
      "language_uk": "Українська (UK)",
      "language_zh": "Мандарин (ZH)",
      "save": "Зберегти",
      "cancel": "Скасувати",
      "languageSettings": "Мова та регіон",
      "generalSettings": "Загальні налаштування",
      "statusNominal": "Статус: Номінальний",
      "openWidgetCatalog": "Відкрити каталог віджетів",
      "authTitle": "Авторизація",
      "authSubtitle": "Введіть пароль, щоб розблокувати OmniDash.",
      "invalidPin": "Недійсний PIN-код.",
      "verifying": "Перевірка...",
      "unlock": "Розблокувати"
    }
  },
  zh: {
    translation: {
      "dashboard": "仪表板",
      "terminal": "AI 终端",
      "memory": "记忆",
      "webSearch": "网络搜索",
      "osint": "开源情报",
      "calendar": "日历",
      "finances": "财务",
      "workouts": "训练",
      "widgets": "小部件",
      "settings": "设置",
      "welcome": "欢迎来到 OmniDash",
      "setupTitle": "初始设置",
      "setupLanguage": "选择系统语言",
      "language_pl": "波兰语 (PL)",
      "language_en": "英语 (EN)",
      "language_uk": "乌克兰语 (UK)",
      "language_zh": "普通话 (ZH)",
      "save": "保存",
      "cancel": "取消",
      "languageSettings": "语言和地区",
      "generalSettings": "常规设置",
      "statusNominal": "状态：正常",
      "openWidgetCatalog": "打开小部件目录",
      "authTitle": "授权",
      "authSubtitle": "输入密码以解锁 OmniDash。",
      "invalidPin": "PIN 码无效。",
      "verifying": "正在验证...",
      "unlock": "解锁"
    }
  }
};

const savedLang = localStorage.getItem('system_language') || 'pl';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'pl',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
