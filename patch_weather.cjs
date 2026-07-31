const fs = require('fs');

let data = fs.readFileSync('/home/lis/Pulpit/ai-system-dashboard/modules/components/WeatherWidget.jsx', 'utf8');

// Imports
data = data.replace(
  "import { Cloud, Sun, CloudRain, Wind, AlertTriangle, Droplets, Eye } from 'lucide-react';",
  "import { Cloud, Sun, CloudRain, Wind, AlertTriangle, Droplets, Eye } from 'lucide-react';\nimport { useTranslation } from 'react-i18next';"
);

data = data.replace(/label:\s*'Słonecznie'/g, "labelKey: 'weatherSunny'");
data = data.replace(/label:\s*'Głównie słonecznie'/g, "labelKey: 'weatherMostlySunny'");
data = data.replace(/label:\s*'Częściowe zachmurzenie'/g, "labelKey: 'weatherPartlyCloudy'");
data = data.replace(/label:\s*'Zachmurzenie'/g, "labelKey: 'weatherCloudy'");
data = data.replace(/label:\s*'Mgła'/g, "labelKey: 'weatherFog'");
data = data.replace(/label:\s*'Mżawka'/g, "labelKey: 'weatherDrizzle'");
data = data.replace(/label:\s*'Lekki deszcz'/g, "labelKey: 'weatherLightRain'");
data = data.replace(/label:\s*'Deszcz'/g, "labelKey: 'weatherRain'");
data = data.replace(/label:\s*'Przelotne opady'/g, "labelKey: 'weatherShowers'");
data = data.replace(/label:\s*'Brak danych'/g, "labelKey: 'weatherNoData'");
data = data.replace(/label:\s*''/g, "labelKey: ''");

data = data.replace(
  "const WeatherWidget = () => {\n  const [weather, setWeather] = useState(null);",
  "const WeatherWidget = () => {\n  const { t } = useTranslation();\n  const [weather, setWeather] = useState(null);"
);

data = data.replace(
  '<span className="text-xs">Brak danych</span>',
  '<span className="text-xs">{t(\'weatherNoData\')}</span>'
);

data = data.replace(
  'const { icon: WeatherIcon, label } = getWeatherIcon(weather.weathercode);',
  'const { icon: WeatherIcon, labelKey } = getWeatherIcon(weather.weathercode);'
);

data = data.replace(
  '<span className="text-[10px] text-textMuted font-mono">{label}</span>',
  '<span className="text-[10px] text-textMuted font-mono">{labelKey ? t(labelKey) : \'\'}</span>'
);

fs.writeFileSync('/home/lis/Pulpit/ai-system-dashboard/modules/components/WeatherWidget.jsx', data);
console.log("WeatherWidget updated");
