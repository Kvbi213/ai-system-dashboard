const fs = require('fs');

let data = fs.readFileSync('/home/lis/Pulpit/ai-system-dashboard/modules/components/TodoList.jsx', 'utf8');

// Imports
data = data.replace(
  "import { CheckSquare, Square, ListTodo, Trash2, Plus, Flag, RotateCcw, X } from 'lucide-react';",
  "import { CheckSquare, Square, ListTodo, Trash2, Plus, Flag, RotateCcw, X } from 'lucide-react';\nimport { useTranslation } from 'react-i18next';"
);

// Add useTranslation
data = data.replace(
  "const TodoList = () => {\n  const [tasks, setTasks] = useState([]);",
  "const TodoList = () => {\n  const { t } = useTranslation();\n  const [tasks, setTasks] = useState([]);"
);

// Replace strings
data = data.replace('Task Pipeline', '{t(\'todoTitle\')}');
data = data.replace('aktywne', '{t(\'todoActive\')}');
data = data.replace('title="Dodaj zadanie"', 'title={t(\'todoAdd\')}');
data = data.replace('placeholder="Tytuł zadania..."', 'placeholder={t(\'todoTitlePlaceholder\')}');

data = data.replace('Priorytet: HIGH', '{t(\'todoPrioHigh\')}');
data = data.replace('Priorytet: MEDIUM', '{t(\'todoPrioMed\')}');
data = data.replace('Priorytet: LOW', '{t(\'todoPrioLow\')}');
data = data.replace('Jednorazowe', '{t(\'todoCatOnce\')}');
data = data.replace('Powtarzalne', '{t(\'todoCatRepeat\')}');
data = data.replace('Inne', '{t(\'todoCatOther\')}');
data = data.replace("'DODAWANIE...' : '+ DODAJ ZADANIE'", "t('todoAdding') : t('todoAddBtn')");
data = data.replace('Brak aktywnych procesów.', '{t(\'todoNoActive\')}');
data = data.replace('cykliczne', '{t(\'todoCyclic\')}');
data = data.replace('Ukończone ({done.length})', '{t(\'todoCompleted\')} ({done.length})');

fs.writeFileSync('/home/lis/Pulpit/ai-system-dashboard/modules/components/TodoList.jsx', data);
console.log("TodoList updated");
