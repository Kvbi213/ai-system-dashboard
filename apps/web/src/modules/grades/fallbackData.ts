import { SubjectGradeItem } from "./components/SubjectGradesGrid";

export function validateFallbackSubjects(data: unknown): data is SubjectGradeItem[] {
  if (!Array.isArray(data)) return false;
  return data.every(
    (s) =>
      typeof s.id === 'string' &&
      typeof s.name === 'string' &&
      typeof s.average === 'number' &&
      Array.isArray(s.grades)
  );
}

export const FALLBACK_LIBRUS_SUBJECTS: readonly SubjectGradeItem[] = [
  {
    "id": "sub_0_biologia",
    "name": "Biologia",
    "average": 4.13,
    "semester1Average": 4.13,
    "grades": [
      {
        "id": "2661119",
        "value": 4.5,
        "displayValue": "4+",
        "weight": 1,
        "category": "odpowiedź ustna",
        "color": "#FFD700",
        "textColor": "#0f172a",
        "date": "2026-10-01",
        "teacher": "Łukaszczyk-Wulgaris Joanna",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      },
      {
        "id": "5436827",
        "value": 3,
        "displayValue": "3",
        "weight": 3,
        "category": "Praca klasowa",
        "color": "#7CFC00",
        "textColor": "#0f172a",
        "date": "2026-10-21",
        "teacher": "Łukaszczyk-Wulgaris Joanna",
        "semester": 1,
        "isImprovement": false,
        "improvedGradeId": "6517463",
        "inAverage": false,
        "isInsideBracket": true
      },
      {
        "id": "6517463",
        "value": 5,
        "displayValue": "5",
        "weight": 3,
        "category": "Praca klasowa",
        "color": "#7CFC00",
        "textColor": "#0f172a",
        "date": "2026-10-28",
        "teacher": "Łukaszczyk-Wulgaris Joanna",
        "semester": 1,
        "isImprovement": true,
        "improvedGradeId": "5436827",
        "improvedValue": "3 (Praca klasowa)",
        "inAverage": true,
        "isInsideBracket": true
      },
      {
        "id": "6542101",
        "value": 4.5,
        "displayValue": "4+",
        "weight": 1,
        "category": "odpowiedź ustna",
        "color": "#FFD700",
        "textColor": "#0f172a",
        "date": "2026-10-28",
        "teacher": "Łukaszczyk-Wulgaris Joanna",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      }
    ]
  },
  {
    "id": "sub_1_biznes_i_zarz_dzanie",
    "name": "Biznes i zarządzanie",
    "average": 4.5,
    "semester1Average": 4.5,
    "grades": [
      {
        "id": "5307591",
        "value": 4.5,
        "displayValue": "4+",
        "weight": 1,
        "category": "kartkówka",
        "color": "#32CD32",
        "textColor": "#0f172a",
        "date": "2026-10-20",
        "teacher": "Sokół Paweł",
        "comment": "Pieniądz w gospodarce rynkowej, Rynek finansowy, Finanse osobiste",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      }
    ]
  },
  {
    "id": "sub_2_chemia",
    "name": "Chemia",
    "average": 2.75,
    "semester1Average": 2.75,
    "grades": [
      {
        "id": "2554576",
        "value": 4.5,
        "displayValue": "4+",
        "weight": 1,
        "category": "Praca w grupach",
        "color": "#F5F5DC",
        "textColor": "#0f172a",
        "date": "2026-10-01",
        "teacher": "Kolasińska Paulina",
        "comment": "Roztwory wodne elektrolitów",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      },
      {
        "id": "6719070",
        "value": 1,
        "displayValue": "1",
        "weight": 1,
        "category": "kartkówka",
        "color": "#32CD32",
        "textColor": "#0f172a",
        "date": "2026-10-28",
        "teacher": "Kolasińska Paulina",
        "comment": "Nazewnictwo alkanów",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      }
    ]
  },
  {
    "id": "sub_3_edukacja_obywatelska",
    "name": "Edukacja obywatelska",
    "average": 5,
    "semester1Average": 5,
    "grades": [
      {
        "id": "983480",
        "value": 5,
        "displayValue": "5",
        "weight": 1,
        "category": "aktywność",
        "color": "#ADFF2F",
        "textColor": "#0f172a",
        "date": "2026-09-18",
        "teacher": "Czarna Alicja",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      },
      {
        "id": "6953970",
        "value": 0,
        "displayValue": "-",
        "weight": 1,
        "category": "prasówka",
        "color": "#F0E68C",
        "textColor": "#0f172a",
        "date": "2026-10-30",
        "teacher": "Czarna Alicja",
        "semester": 1,
        "isImprovement": false,
        "inAverage": false,
        "isInsideBracket": false
      }
    ]
  },
  {
    "id": "sub_4_edukacja_zdrowotna",
    "name": "Edukacja zdrowotna",
    "average": 0,
    "grades": []
  },
  {
    "id": "sub_5_historia",
    "name": "Historia",
    "average": 4,
    "semester1Average": 4,
    "grades": [
      {
        "id": "2034728",
        "value": 4,
        "displayValue": "4",
        "weight": 1,
        "category": "kartkówka",
        "color": "#32CD32",
        "textColor": "#0f172a",
        "date": "2026-09-28",
        "teacher": "Wardyn Wojciech",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      },
      {
        "id": "2677693",
        "value": 4,
        "displayValue": "4",
        "weight": 1,
        "category": "Praca w grupach",
        "color": "#F5F5DC",
        "textColor": "#0f172a",
        "date": "2026-10-01",
        "teacher": "Wardyn Wojciech",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      },
      {
        "id": "3632946",
        "value": 4,
        "displayValue": "4",
        "weight": 1,
        "category": "zadanie",
        "color": "#66CDAA",
        "textColor": "#0f172a",
        "date": "2026-10-08",
        "teacher": "Wardyn Wojciech",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      }
    ]
  },
  {
    "id": "sub_6_informatyka",
    "name": "Informatyka",
    "average": 5.5,
    "semester1Average": 5.5,
    "grades": [
      {
        "id": "1976428",
        "value": 6,
        "displayValue": "6",
        "weight": 1,
        "category": "zadanie",
        "color": "#66CDAA",
        "textColor": "#0f172a",
        "date": "2026-09-28",
        "teacher": "Becker Adam",
        "comment": "bhp/cpp-bmi-debugging/ppt-nobliści",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      },
      {
        "id": "7233622",
        "value": 5,
        "displayValue": "5",
        "weight": 1,
        "category": "aktywność",
        "color": "#ADFF2F",
        "textColor": "#0f172a",
        "date": "2026-11-02",
        "teacher": "Becker Adam",
        "comment": "portfolio",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      }
    ]
  },
  {
    "id": "sub_7_j_zyk_angielski",
    "name": "Język angielski",
    "average": 4.33,
    "semester1Average": 4.33,
    "grades": [
      {
        "id": "829132",
        "value": 5,
        "displayValue": "5",
        "weight": 1,
        "category": "kartkówka",
        "color": "#32CD32",
        "textColor": "#0f172a",
        "date": "2026-09-17",
        "teacher": "Ziemba Joanna",
        "comment": "słownictwo unit 4",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      },
      {
        "id": "909325",
        "value": 5,
        "displayValue": "5",
        "weight": 1,
        "category": "aktywność",
        "color": "#ADFF2F",
        "textColor": "#0f172a",
        "date": "2026-09-18",
        "teacher": "Ziemba Joanna",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      },
      {
        "id": "1611467",
        "value": 0,
        "displayValue": "-",
        "weight": 1,
        "category": "aktywność",
        "color": "#ADFF2F",
        "textColor": "#0f172a",
        "date": "2026-09-24",
        "teacher": "Ziemba Joanna",
        "semester": 1,
        "isImprovement": false,
        "inAverage": false,
        "isInsideBracket": false
      },
      {
        "id": "2824639",
        "value": 0,
        "displayValue": "+",
        "weight": 1,
        "category": "aktywność",
        "color": "#ADFF2F",
        "textColor": "#0f172a",
        "date": "2026-10-02",
        "teacher": "Ziemba Joanna",
        "semester": 1,
        "isImprovement": false,
        "inAverage": false,
        "isInsideBracket": false
      },
      {
        "id": "5138679",
        "value": 3,
        "displayValue": "3",
        "weight": 1,
        "category": "sprawdzian",
        "color": "#FFA07A",
        "textColor": "#0f172a",
        "date": "2026-10-20",
        "teacher": "Ziemba Joanna",
        "comment": "question tags + defining relative clauses",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      },
      {
        "id": "6895219",
        "value": 0,
        "displayValue": "+",
        "weight": 1,
        "category": "aktywność",
        "color": "#ADFF2F",
        "textColor": "#0f172a",
        "date": "2026-10-29",
        "teacher": "Ziemba Joanna",
        "semester": 1,
        "isImprovement": false,
        "inAverage": false,
        "isInsideBracket": false
      }
    ]
  },
  {
    "id": "sub_8_j_zyk_angielski_zawodowy",
    "name": "Język angielski zawodowy",
    "average": 5,
    "semester1Average": 5,
    "grades": [
      {
        "id": "2552196",
        "value": 5,
        "displayValue": "5",
        "weight": 1,
        "category": "zadanie",
        "color": "#66CDAA",
        "textColor": "#0f172a",
        "date": "2026-10-01",
        "teacher": "Ziemba Joanna",
        "comment": "job advertisement",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      },
      {
        "id": "6897196",
        "value": 0,
        "displayValue": "+",
        "weight": 1,
        "category": "aktywność",
        "color": "#ADFF2F",
        "textColor": "#0f172a",
        "date": "2026-10-29",
        "teacher": "Ziemba Joanna",
        "semester": 1,
        "isImprovement": false,
        "inAverage": false,
        "isInsideBracket": false
      }
    ]
  },
  {
    "id": "sub_9_j_zyk_niemiecki",
    "name": "Język niemiecki",
    "average": 3.5,
    "semester1Average": 3.5,
    "grades": [
      {
        "id": "316188",
        "value": 4.5,
        "displayValue": "4+",
        "weight": 1,
        "category": "praca domowa",
        "color": "#3333FF",
        "textColor": "#ffffff",
        "date": "2026-09-11",
        "teacher": "Chyła Beata",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      },
      {
        "id": "2119728",
        "value": 2.5,
        "displayValue": "2+",
        "weight": 1,
        "category": "kartkówka",
        "color": "#32CD32",
        "textColor": "#0f172a",
        "date": "2026-09-28",
        "teacher": "Chyła Beata",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      },
      {
        "id": "4691628",
        "value": 2,
        "displayValue": "2",
        "weight": 1,
        "category": "słownictwo",
        "color": "#BDB76B",
        "textColor": "#0f172a",
        "date": "2026-10-16",
        "teacher": "Chyła Beata",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      },
      {
        "id": "5863304",
        "value": 0,
        "displayValue": "+",
        "weight": 1,
        "category": "aktywność",
        "color": "#ADFF2F",
        "textColor": "#0f172a",
        "date": "2026-10-23",
        "teacher": "Chyła Beata",
        "semester": 1,
        "isImprovement": false,
        "inAverage": false,
        "isInsideBracket": false
      },
      {
        "id": "6281328",
        "value": 5,
        "displayValue": "5",
        "weight": 1,
        "category": "prezentacja",
        "color": "#66CDAA",
        "textColor": "#0f172a",
        "date": "2026-10-27",
        "teacher": "Chyła Beata",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      }
    ]
  },
  {
    "id": "sub_10_j_zyk_polski",
    "name": "Język polski",
    "average": 3.88,
    "semester1Average": 3.88,
    "grades": [
      {
        "id": "767218",
        "value": 1,
        "displayValue": "1",
        "weight": 1,
        "category": "kartkówka",
        "color": "#32CD32",
        "textColor": "#0f172a",
        "date": "2026-09-17",
        "teacher": "Negowska Alicja",
        "comment": "barok- wprowadzenie",
        "semester": 1,
        "isImprovement": false,
        "improvedGradeId": "1004112",
        "inAverage": false,
        "isInsideBracket": true
      },
      {
        "id": "1004112",
        "value": 4,
        "displayValue": "4",
        "weight": 1,
        "category": "kartkówka",
        "color": "#32CD32",
        "textColor": "#0f172a",
        "date": "2026-09-18",
        "teacher": "Negowska Alicja",
        "semester": 1,
        "isImprovement": true,
        "improvedGradeId": "767218",
        "improvedValue": "1 (kartkówka)",
        "inAverage": true,
        "isInsideBracket": true
      },
      {
        "id": "995881",
        "value": 5.5,
        "displayValue": "5+",
        "weight": 1,
        "category": "zadanie",
        "color": "#66CDAA",
        "textColor": "#0f172a",
        "date": "2026-09-18",
        "teacher": "Negowska Alicja",
        "comment": "prezentacje - sztuka baroku",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      },
      {
        "id": "6191574",
        "value": 0,
        "displayValue": "+",
        "weight": 1,
        "category": "aktywność",
        "color": "#ADFF2F",
        "textColor": "#0f172a",
        "date": "2026-10-26",
        "teacher": "Negowska Alicja",
        "semester": 1,
        "isImprovement": false,
        "inAverage": false,
        "isInsideBracket": false
      },
      {
        "id": "7091674",
        "value": 5,
        "displayValue": "5",
        "weight": 1,
        "category": "Test wiedzy z lektury",
        "color": "#DC143C",
        "textColor": "#ffffff",
        "date": "2026-10-30",
        "teacher": "Negowska Alicja",
        "comment": "Makbet- test po przeczytaniu lektury",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      },
      {
        "id": "7299225",
        "value": 0,
        "displayValue": "+",
        "weight": 1,
        "category": "aktywność",
        "color": "#ADFF2F",
        "textColor": "#0f172a",
        "date": "2026-11-02",
        "teacher": "Negowska Alicja",
        "semester": 1,
        "isImprovement": false,
        "inAverage": false,
        "isInsideBracket": false
      }
    ]
  },
  {
    "id": "sub_11_lokalne_sieci_komputerowe",
    "name": "Lokalne sieci komputerowe",
    "average": 5,
    "semester1Average": 5,
    "grades": [
      {
        "id": "3927791",
        "value": 5,
        "displayValue": "5",
        "weight": 1,
        "category": "aktywność",
        "color": "#ADFF2F",
        "textColor": "#0f172a",
        "date": "2026-10-09",
        "teacher": "Wojnarowski Przemysław",
        "comment": "symbole i piktogramy w sieciach komputerowych",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      }
    ]
  },
  {
    "id": "sub_12_matematyka",
    "name": "Matematyka",
    "average": 3.36,
    "semester1Average": 3.36,
    "grades": [
      {
        "id": "138759",
        "value": 3,
        "displayValue": "3",
        "weight": 1,
        "category": "Odpowiedź/kartkówka",
        "color": "#E6E6FA",
        "textColor": "#0f172a",
        "date": "2026-09-08",
        "teacher": "Bahr Zbigniew",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      },
      {
        "id": "611954",
        "value": 5,
        "displayValue": "5",
        "weight": 1,
        "category": "Odpowiedź/kartkówka",
        "color": "#E6E6FA",
        "textColor": "#0f172a",
        "date": "2026-09-15",
        "teacher": "Bahr Zbigniew",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      },
      {
        "id": "1355469",
        "value": 5,
        "displayValue": "5",
        "weight": 1,
        "category": "Aktywność",
        "color": "#FFD700",
        "textColor": "#0f172a",
        "date": "2026-09-22",
        "teacher": "Bahr Zbigniew",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      },
      {
        "id": "1660212",
        "value": 3,
        "displayValue": "3",
        "weight": 2,
        "category": "sprawdzian",
        "color": "#32CD32",
        "textColor": "#0f172a",
        "date": "2026-09-24",
        "teacher": "Bahr Zbigniew",
        "comment": "funkcja liniowa",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      },
      {
        "id": "3558014",
        "value": 3,
        "displayValue": "3",
        "weight": 1,
        "category": "Odpowiedź/kartkówka",
        "color": "#E6E6FA",
        "textColor": "#0f172a",
        "date": "2026-10-07",
        "teacher": "Bahr Zbigniew",
        "comment": "graficznie i algebraicznie",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      },
      {
        "id": "5974954",
        "value": 2,
        "displayValue": "2",
        "weight": 3,
        "category": "Praca klasowa",
        "color": "#FF0000",
        "textColor": "#ffffff",
        "date": "2026-10-25",
        "teacher": "Bahr Zbigniew",
        "comment": "funkcja liniowa",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      },
      {
        "id": "6567892",
        "value": 4,
        "displayValue": "4",
        "weight": 1,
        "category": "Odpowiedź/kartkówka",
        "color": "#E6E6FA",
        "textColor": "#0f172a",
        "date": "2026-10-28",
        "teacher": "Bahr Zbigniew",
        "comment": "Tales",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      },
      {
        "id": "7821437",
        "value": 5,
        "displayValue": "5",
        "weight": 1,
        "category": "Odpowiedź/kartkówka",
        "color": "#E6E6FA",
        "textColor": "#0f172a",
        "date": "2026-11-04",
        "teacher": "Bahr Zbigniew",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      }
    ]
  },
  {
    "id": "sub_13_pracownia_lokalnych_sieci_komputerowych",
    "name": "Pracownia lokalnych sieci komputerowych",
    "average": 5,
    "semester1Average": 5,
    "grades": [
      {
        "id": "816464",
        "value": 5,
        "displayValue": "5",
        "weight": 1,
        "category": "zadanie",
        "color": "#66CDAA",
        "textColor": "#0f172a",
        "date": "2026-09-17",
        "teacher": "Kryła Łukasz",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      },
      {
        "id": "4534719",
        "value": 5,
        "displayValue": "5",
        "weight": 1,
        "category": "Gdniazo",
        "color": "#FFA07A",
        "textColor": "#0f172a",
        "date": "2026-10-15",
        "teacher": "Kryła Łukasz",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      }
    ]
  },
  {
    "id": "sub_14_pracownia_system_w_operacyjnych",
    "name": "Pracownia systemów operacyjnych",
    "average": 0,
    "grades": []
  },
  {
    "id": "sub_15_pracownia_urz_dze__techniki_komputerowej",
    "name": "Pracownia urządzeń techniki komputerowej",
    "average": 5,
    "semester1Average": 5,
    "grades": [
      {
        "id": "1240939",
        "value": 5,
        "displayValue": "5",
        "weight": 1,
        "category": "zadanie",
        "color": "#66CDAA",
        "textColor": "#0f172a",
        "date": "2026-09-22",
        "teacher": "Wojnarowski Przemysław",
        "comment": "modernizacja zestawu komputerowego",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      },
      {
        "id": "6318131",
        "value": 5,
        "displayValue": "5",
        "weight": 1,
        "category": "zadanie",
        "color": "#66CDAA",
        "textColor": "#0f172a",
        "date": "2026-10-20",
        "teacher": "Wojnarowski Przemysław",
        "comment": "Diagnostyka serwisowa zestawu komputerowego",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      }
    ]
  },
  {
    "id": "sub_16_religia",
    "name": "Religia",
    "average": 0,
    "grades": []
  },
  {
    "id": "sub_17_systemy_operacyjne",
    "name": "Systemy operacyjne",
    "average": 5,
    "semester1Average": 5,
    "grades": [
      {
        "id": "1171137",
        "value": 5,
        "displayValue": "5",
        "weight": 1,
        "category": "zadanie",
        "color": "#66CDAA",
        "textColor": "#0f172a",
        "date": "2026-09-21",
        "teacher": "Wojnarowski Przemysław",
        "comment": "Struktura folderów i zarządzanie przez cud",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      },
      {
        "id": "2066473",
        "value": 0,
        "displayValue": "-",
        "weight": 1,
        "category": "zadanie",
        "color": "#66CDAA",
        "textColor": "#0f172a",
        "date": "2026-09-28",
        "teacher": "Wojnarowski Przemysław",
        "comment": "diagnostyka systemu",
        "semester": 1,
        "isImprovement": false,
        "inAverage": false,
        "isInsideBracket": false
      }
    ]
  },
  {
    "id": "sub_18_urz_dzenia_techniki_komputerowej",
    "name": "Urządzenia techniki komputerowej",
    "average": 2.75,
    "semester1Average": 2.75,
    "grades": [
      {
        "id": "3570755",
        "value": 2.75,
        "displayValue": "3-",
        "weight": 1,
        "category": "sprawdzian",
        "color": "#FFA07A",
        "textColor": "#0f172a",
        "date": "2026-10-08",
        "teacher": "Gembiak Bartosz",
        "semester": 1,
        "isImprovement": false,
        "inAverage": true,
        "isInsideBracket": false
      }
    ]
  },
  {
    "id": "sub_19_wychowanie_fizyczne",
    "name": "Wychowanie fizyczne",
    "average": 0,
    "grades": [
      {
        "id": "2197682",
        "value": 0,
        "displayValue": "-",
        "weight": 1,
        "category": "aktywność",
        "color": "#ADFF2F",
        "textColor": "#0f172a",
        "date": "2026-09-29",
        "teacher": "Łysakowski Grzegorz",
        "semester": 1,
        "isImprovement": false,
        "inAverage": false,
        "isInsideBracket": false
      }
    ]
  },
  {
    "id": "sub_20_zaj_cia_z_wychowawc_",
    "name": "Zajęcia z wychowawcą",
    "average": 0,
    "grades": []
  }
] as const;
