const fs = require('fs');

const data = fs.readFileSync('/home/lis/Pulpit/ai-system-dashboard/modules/i18n.js', 'utf8');

// We will do a string replacement to inject our keys.
// Find the end of each language block.
// Example: "unlock": "Odblokuj"\n    }
const addKeys = (langData, newKeys) => {
    return langData.replace(/(\n\s*\}\n\s*\},\n|\n\s*\}\n\s*\}\n?)$/, (match) => {
        const keysStr = Object.entries(newKeys).map(([k, v]) => `,\n      "${k}": "${v}"`).join('');
        return keysStr + match;
    });
};

const newKeysPl = {
  todoTitle: "Task Pipeline",
  todoActive: "aktywne",
  todoNoActive: "Brak aktywnych procesów.",
  todoAdd: "Dodaj zadanie",
  todoTitlePlaceholder: "Tytuł zadania...",
  todoPrioHigh: "Priorytet: HIGH",
  todoPrioMed: "Priorytet: MEDIUM",
  todoPrioLow: "Priorytet: LOW",
  todoCatOnce: "Jednorazowe",
  todoCatRepeat: "Powtarzalne",
  todoCatOther: "Inne",
  todoAdding: "DODAWANIE...",
  todoAddBtn: "+ DODAJ ZADANIE",
  todoCyclic: "cykliczne",
  todoCompleted: "Ukończone",
  newsTickerTitle: "IT Intel Feed",
  newsRefresh: "Odśwież",
  newsLive: "LIVE",
  newsConnError: "Brak połączenia z feed. Serwer pobiera dane...",
  newsNoResults: "Brak wyników dla tej kategorii.",
  newsFeedTitle: "System Intel Log",
  newsFeedWaiting: "Oczekiwanie na pierwszy cykl AI...",
  timeAgoSeconds: "s temu",
  timeAgoMinutes: " min temu",
  timeAgoHours: "h temu",
  timeAgoDays: "d temu",
  routinesTitle: "Procedury / Makra",
  routinesMorningReport: "Poranny Raport",
  routinesMorningDesc: "Pogoda, dzisiejszy kalendarz, zadania",
  routinesEveningScan: "Wieczorny Skan",
  routinesEveningDesc: "Podsumowanie dnia, IT News",
  routinesSystemStatus: "Status Systemu",
  routinesSystemDesc: "Zasoby, obciążenie, pamięć",
  routinesResetCtx: "Zresetuj Kontekst",
  routinesResetDesc: "Wyczyść czat i bufor",
  weatherSunny: "Słonecznie",
  weatherMostlySunny: "Głównie słonecznie",
  weatherPartlyCloudy: "Częściowe zachmurzenie",
  weatherCloudy: "Zachmurzenie",
  weatherFog: "Mgła",
  weatherDrizzle: "Mżawka",
  weatherLightRain: "Lekki deszcz",
  weatherRain: "Deszcz",
  weatherShowers: "Przelotne opady",
  weatherNoData: "Brak danych",
  notifTitle: "Signal Intercept",
  notifRefresh: "Odśwież",
  notifNoSignals: "Brak sygnałów"
};

const newKeysEn = {
  todoTitle: "Task Pipeline",
  todoActive: "active",
  todoNoActive: "No active processes.",
  todoAdd: "Add task",
  todoTitlePlaceholder: "Task title...",
  todoPrioHigh: "Priority: HIGH",
  todoPrioMed: "Priority: MEDIUM",
  todoPrioLow: "Priority: LOW",
  todoCatOnce: "One-time",
  todoCatRepeat: "Recurring",
  todoCatOther: "Other",
  todoAdding: "ADDING...",
  todoAddBtn: "+ ADD TASK",
  todoCyclic: "cyclic",
  todoCompleted: "Completed",
  newsTickerTitle: "IT Intel Feed",
  newsRefresh: "Refresh",
  newsLive: "LIVE",
  newsConnError: "No connection to feed. Server fetching data...",
  newsNoResults: "No results for this category.",
  newsFeedTitle: "System Intel Log",
  newsFeedWaiting: "Awaiting first AI cycle...",
  timeAgoSeconds: "s ago",
  timeAgoMinutes: " min ago",
  timeAgoHours: "h ago",
  timeAgoDays: "d ago",
  routinesTitle: "Routines / Macros",
  routinesMorningReport: "Morning Report",
  routinesMorningDesc: "Weather, today's calendar, tasks",
  routinesEveningScan: "Evening Scan",
  routinesEveningDesc: "Daily summary, IT News",
  routinesSystemStatus: "System Status",
  routinesSystemDesc: "Resources, load, memory",
  routinesResetCtx: "Reset Context",
  routinesResetDesc: "Clear chat and buffer",
  weatherSunny: "Sunny",
  weatherMostlySunny: "Mostly sunny",
  weatherPartlyCloudy: "Partly cloudy",
  weatherCloudy: "Cloudy",
  weatherFog: "Fog",
  weatherDrizzle: "Drizzle",
  weatherLightRain: "Light rain",
  weatherRain: "Rain",
  weatherShowers: "Showers",
  weatherNoData: "No data",
  notifTitle: "Signal Intercept",
  notifRefresh: "Refresh",
  notifNoSignals: "No signals"
};

const newKeysUk = {
  todoTitle: "Конвеєр завдань",
  todoActive: "активних",
  todoNoActive: "Немає активних процесів.",
  todoAdd: "Додати завдання",
  todoTitlePlaceholder: "Назва завдання...",
  todoPrioHigh: "Пріоритет: ВИСОКИЙ",
  todoPrioMed: "Пріоритет: СЕРЕДНІЙ",
  todoPrioLow: "Пріоритет: НИЗЬКИЙ",
  todoCatOnce: "Одноразові",
  todoCatRepeat: "Регулярні",
  todoCatOther: "Інше",
  todoAdding: "ДОДАВАННЯ...",
  todoAddBtn: "+ ДОДАТИ ЗАВДАННЯ",
  todoCyclic: "циклічно",
  todoCompleted: "Завершено",
  newsTickerTitle: "Стрічка IT Інтелу",
  newsRefresh: "Оновити",
  newsLive: "НАЖИВО",
  newsConnError: "Немає з'єднання зі стрічкою. Сервер отримує дані...",
  newsNoResults: "Немає результатів для цієї категорії.",
  newsFeedTitle: "Журнал системи",
  newsFeedWaiting: "Очікування першого циклу ШІ...",
  timeAgoSeconds: "с тому",
  timeAgoMinutes: " хв тому",
  timeAgoHours: "год тому",
  timeAgoDays: "д тому",
  routinesTitle: "Процедури / Макроси",
  routinesMorningReport: "Ранковий звіт",
  routinesMorningDesc: "Погода, сьогоднішній календар, завдання",
  routinesEveningScan: "Вечірнє сканування",
  routinesEveningDesc: "Підсумки дня, IT новини",
  routinesSystemStatus: "Статус системи",
  routinesSystemDesc: "Ресурси, навантаження, пам'ять",
  routinesResetCtx: "Скинути контекст",
  routinesResetDesc: "Очистити чат та буфер",
  weatherSunny: "Сонячно",
  weatherMostlySunny: "Переважно сонячно",
  weatherPartlyCloudy: "Мінлива хмарність",
  weatherCloudy: "Хмарно",
  weatherFog: "Туман",
  weatherDrizzle: "Мряка",
  weatherLightRain: "Легкий дощ",
  weatherRain: "Дощ",
  weatherShowers: "Зливи",
  weatherNoData: "Немає даних",
  notifTitle: "Перехоплення сигналів",
  notifRefresh: "Оновити",
  notifNoSignals: "Немає сигналів"
};

const newKeysZh = {
  todoTitle: "任务管道",
  todoActive: "活跃",
  todoNoActive: "没有活跃的进程。",
  todoAdd: "添加任务",
  todoTitlePlaceholder: "任务标题...",
  todoPrioHigh: "优先级：高",
  todoPrioMed: "优先级：中",
  todoPrioLow: "优先级：低",
  todoCatOnce: "一次性",
  todoCatRepeat: "重复",
  todoCatOther: "其他",
  todoAdding: "添加中...",
  todoAddBtn: "+ 添加任务",
  todoCyclic: "循环",
  todoCompleted: "已完成",
  newsTickerTitle: "IT情报源",
  newsRefresh: "刷新",
  newsLive: "直播",
  newsConnError: "无法连接到信息源。服务器正在获取数据...",
  newsNoResults: "该类别没有结果。",
  newsFeedTitle: "系统情报日志",
  newsFeedWaiting: "等待第一次AI循环...",
  timeAgoSeconds: "秒前",
  timeAgoMinutes: "分钟前",
  timeAgoHours: "小时前",
  timeAgoDays: "天前",
  routinesTitle: "例程/宏",
  routinesMorningReport: "晨报",
  routinesMorningDesc: "天气，今日日历，任务",
  routinesEveningScan: "晚间扫描",
  routinesEveningDesc: "每日摘要，IT新闻",
  routinesSystemStatus: "系统状态",
  routinesSystemDesc: "资源，负载，内存",
  routinesResetCtx: "重置上下文",
  routinesResetDesc: "清除聊天和缓冲区",
  weatherSunny: "晴朗",
  weatherMostlySunny: "大部晴朗",
  weatherPartlyCloudy: "局部多云",
  weatherCloudy: "多云",
  weatherFog: "雾",
  weatherDrizzle: "毛毛雨",
  weatherLightRain: "小雨",
  weatherRain: "雨",
  weatherShowers: "阵雨",
  weatherNoData: "无数据",
  notifTitle: "信号拦截",
  notifRefresh: "刷新",
  notifNoSignals: "无信号"
};

let out = data;
const blockRe = /([a-z]{2}):\s*\{\s*translation:\s*\{([\s\S]*?)\n\s*\}\n\s*\}/g;
let match;
const blocks = [];
while((match = blockRe.exec(data)) !== null) {
  blocks.push({
    lang: match[1],
    fullMatch: match[0],
    inner: match[2]
  });
}

for(const b of blocks) {
  let keysObj = {};
  if (b.lang === 'pl') keysObj = newKeysPl;
  else if (b.lang === 'en') keysObj = newKeysEn;
  else if (b.lang === 'uk') keysObj = newKeysUk;
  else if (b.lang === 'zh') keysObj = newKeysZh;
  
  if(Object.keys(keysObj).length > 0) {
    const keysStr = Object.entries(keysObj).map(([k, v]) => `,\n      "${k}": "${v}"`).join('');
    const newBlock = b.fullMatch.replace(/\n\s*\}\n\s*\}$/, keysStr + '\n    }\n  }');
    out = out.replace(b.fullMatch, newBlock);
  }
}

fs.writeFileSync('/home/lis/Pulpit/ai-system-dashboard/modules/i18n.js', out);
console.log("Updated i18n.js");
