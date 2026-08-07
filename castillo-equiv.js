/* castillo-equiv.js — equivalencias/sustituciones de alimentos.
   Regla (validada por Alex): cambiar SOLO dentro de la misma familia; igualar por CALORÍAS;
   3-4 opciones; verduras/frutas/salsas NO se sustituyen. El cliente ve gramos + kcal; los
   macros se calculan por detrás. Valores por 100 g (kcal, P, C, G) de la tabla validada. */
(function (w) {
  var ALT = {
    carbo: [
      { n: 'Arroz blanco', en: 'White rice', k: 130, p: 3, c: 28, g: 0 }, { n: 'Pasta', en: 'Pasta', k: 158, p: 6, c: 31, g: 1 },
      { n: 'Pan blanco', en: 'White bread', k: 265, p: 8, c: 51, g: 3 }, { n: 'Patata', en: 'Potato', k: 77, p: 2, c: 17, g: 0 },
      { n: 'Boniato', en: 'Sweet potato', k: 86, p: 2, c: 20, g: 0 }, { n: 'Avena', en: 'Oats', k: 380, p: 14, c: 60, g: 7 },
      { n: 'Cuscús', en: 'Couscous', k: 112, p: 4, c: 23, g: 0 }, { n: 'Garbanzos', en: 'Chickpeas', k: 164, p: 9, c: 27, g: 3 },
      { n: 'Lentejas', en: 'Lentils', k: 116, p: 8, c: 19, g: 0 }
    ],
    prote: [
      { n: 'Pechuga de pollo', en: 'Chicken breast', k: 120, p: 23, c: 0, g: 3 }, { n: 'Pavo', en: 'Turkey', k: 104, p: 17, c: 4, g: 2 },
      { n: 'Ternera magra', en: 'Lean beef', k: 159, p: 28, c: 0, g: 5 }, { n: 'Salmón', en: 'Salmon', k: 146, p: 22, c: 0, g: 6 },
      { n: 'Merluza', en: 'Hake', k: 80, p: 18, c: 0, g: 1 }, { n: 'Atún al natural', en: 'Tuna', k: 100, p: 23, c: 0, g: 1 },
      { n: 'Huevo', en: 'Egg', k: 148, p: 13, c: 1, g: 10 }, { n: 'Gambas', en: 'Prawns', k: 105, p: 20, c: 1, g: 2 }
    ],
    grasa: [
      { n: 'Aceite de oliva', en: 'Olive oil', k: 884, p: 0, c: 0, g: 100 }, { n: 'Aguacate', en: 'Avocado', k: 160, p: 2, c: 9, g: 15 },
      { n: 'Nueces', en: 'Walnuts', k: 654, p: 15, c: 14, g: 65 }, { n: 'Almendras', en: 'Almonds', k: 583, p: 22, c: 20, g: 51 },
      { n: 'Crema de cacahuete', en: 'Peanut butter', k: 588, p: 25, c: 20, g: 50 }
    ],
    lacteo: [
      { n: 'Leche desnatada', en: 'Skim milk', k: 34, p: 3, c: 5, g: 0 }, { n: 'Yogur natural', en: 'Natural yogurt', k: 60, p: 4, c: 5, g: 3 },
      { n: 'Yogur griego', en: 'Greek yogurt', k: 117, p: 4, c: 5, g: 9 }, { n: 'Kéfir', en: 'Kefir', k: 40, p: 3, c: 5, g: 1 }
    ]
  };
  var KW = {
    verdura: ['tomate', 'tomato', 'brocoli', 'broccoli', 'zanahoria', 'carrot', 'pimiento', 'pepper', 'esparrago', 'asparagus', 'alcachofa', 'champiñ', 'champin', 'mushroom', 'pepino', 'cucumber', 'cebolla', 'onion', 'lechuga', 'lettuce', 'ensalada', 'salad', 'judia', 'green bean', 'calabacin', 'zucchini', 'espinaca', 'spinach', 'verdura', 'menestra', 'pure de verd'],
    fruta: ['platano', 'banana', 'fresa', 'strawberr', 'mango', 'papaya', 'manzana', 'apple', 'arandano', 'blueberr', 'frutos rojos', 'pera', 'pear', 'naranja', 'orange', 'kiwi', 'uva', 'grape', 'sandia', 'melon', 'piña', 'pina', 'pineapple', 'fruta'],
    salsa: ['ketchup', 'tomate frito', 'tomato sauce', 'salsa', 'carbonara', 'pesto', 'canela', 'cinnamon', 'mermelada', 'jelly', 'cacao', 'chocolate', 'choco', 'sirope', 'syrup', 'barra de', 'barrita', 'whey', 'proteina en polvo', 'granola', 'cereal', 'corn flakes', 'weetabix'],
    lacteo: ['leche', 'milk', 'yogur', 'yogurt', 'kefir', 'kéfir', 'batido'],
    prote: ['huevo', 'egg', 'clara', 'jamon', 'ham']
  };
  function nrm(s) { return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }
  function grupoDe(food) {
    var n = nrm(food.name);
    for (var g in KW) { for (var i = 0; i < KW[g].length; i++) { if (n.indexOf(nrm(KW[g][i])) >= 0) return g; } }
    var kp = (food.p || 0) * 4, kc = (food.c || 0) * 4, kg = (food.g || 0) * 9, mx = Math.max(kp, kc, kg);
    if (mx <= 0) return null;
    if (mx === kg) return 'grasa'; if (mx === kp) return 'prote'; return 'carbo';
  }
  var SUST = { carbo: 1, prote: 1, grasa: 1, lacteo: 1 };
  function esFijo(food) { var g = grupoDe(food); return !g || !SUST[g]; }
  function r1(x) { return Math.round(x * 10) / 10; }
  function alternativas(food, lang) {
    var g = grupoDe(food);
    if (!g || !SUST[g]) return null;
    var self = nrm(food.name);
    var k0 = (food.unit === 'g' && food.qty > 0) ? (food.kcal * 100 / food.qty) : 0;
    var list = ALT[g].filter(function (a) { return nrm(a.n).indexOf(self) < 0 && self.indexOf(nrm(a.n)) < 0; });
    if (k0 > 0) list = list.slice().sort(function (a, b) { return Math.abs(a.k - k0) - Math.abs(b.k - k0); });
    return list.slice(0, 4).map(function (a) {
      var grams = Math.max(1, Math.round(food.kcal / (a.k / 100))); // gramos EXACTOS para igualar kcal
      return {
        name: (lang === 'en' ? a.en : a.n), grams: grams, grupo: g,
        kcal: Math.round(grams * a.k / 100),          // kcal reales del sustituto (≈ objetivo)
        p: r1(grams * a.p / 100), c: r1(grams * a.c / 100), g: r1(grams * a.g / 100) // macros por detrás
      };
    });
  }
  w.EQUIV = { grupoDe: grupoDe, esFijo: esFijo, alternativas: alternativas };
})(typeof window !== 'undefined' ? window : globalThis);
