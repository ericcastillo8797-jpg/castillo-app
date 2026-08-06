/* castillo-equiv.js — equivalencias/sustituciones de alimentos.
   Regla (validada por Alex): cambiar SOLO dentro de la misma familia; igualar por CALORÍAS;
   3-4 opciones; verduras/frutas/salsas NO se sustituyen. Ver PDF "Equivalencias".  */
(function (w) {
  // Alternativas por grupo sustituible, con kcal/100g (base validada por Alex).
  var ALT = {
    carbo: [
      { n: 'Arroz blanco', en: 'White rice', k: 130 }, { n: 'Pasta', en: 'Pasta', k: 158 },
      { n: 'Pan blanco', en: 'White bread', k: 265 }, { n: 'Patata', en: 'Potato', k: 77 },
      { n: 'Boniato', en: 'Sweet potato', k: 86 }, { n: 'Avena', en: 'Oats', k: 380 },
      { n: 'Cuscús', en: 'Couscous', k: 112 }, { n: 'Garbanzos', en: 'Chickpeas', k: 164 },
      { n: 'Lentejas', en: 'Lentils', k: 116 }
    ],
    prote: [
      { n: 'Pechuga de pollo', en: 'Chicken breast', k: 120 }, { n: 'Pavo', en: 'Turkey', k: 104 },
      { n: 'Ternera magra', en: 'Lean beef', k: 159 }, { n: 'Salmón', en: 'Salmon', k: 146 },
      { n: 'Merluza', en: 'Hake', k: 80 }, { n: 'Atún al natural', en: 'Tuna', k: 100 },
      { n: 'Huevo', en: 'Egg', k: 148 }, { n: 'Gambas', en: 'Prawns', k: 105 }
    ],
    grasa: [
      { n: 'Aceite de oliva', en: 'Olive oil', k: 884 }, { n: 'Aguacate', en: 'Avocado', k: 160 },
      { n: 'Nueces', en: 'Walnuts', k: 654 }, { n: 'Almendras', en: 'Almonds', k: 583 },
      { n: 'Crema de cacahuete', en: 'Peanut butter', k: 588 }
    ],
    lacteo: [
      { n: 'Leche desnatada', en: 'Skim milk', k: 34 }, { n: 'Yogur natural', en: 'Natural yogurt', k: 60 },
      { n: 'Yogur griego', en: 'Greek yogurt', k: 117 }, { n: 'Kéfir', en: 'Kefir', k: 40 }
    ]
  };
  // Palabras clave: fuerzan grupo por NOMBRE (antes que el macro dominante). Verdura/fruta/salsa = fijos.
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
  function alternativas(food, lang) {
    var g = grupoDe(food);
    if (!g || !SUST[g]) return null;
    var self = nrm(food.name);
    var k0 = (food.unit === 'g' && food.qty > 0) ? (food.kcal * 100 / food.qty) : 0; // kcal/100g del actual
    var list = ALT[g].filter(function (a) { return nrm(a.n).indexOf(self) < 0 && self.indexOf(nrm(a.n)) < 0; });
    if (k0 > 0) list = list.slice().sort(function (a, b) { return Math.abs(a.k - k0) - Math.abs(b.k - k0); });
    return list.slice(0, 4).map(function (a) {
      var grams = Math.round(food.kcal / (a.k / 100));
      grams = Math.max(5, Math.round(grams / 5) * 5); // múltiplos de 5 g, usable
      return { name: (lang === 'en' ? a.en : a.n), grams: grams, kcal: Math.round(food.kcal), grupo: g };
    });
  }
  w.EQUIV = { grupoDe: grupoDe, esFijo: esFijo, alternativas: alternativas };
})(typeof window !== 'undefined' ? window : globalThis);
