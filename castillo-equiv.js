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
    ],
    // Alex (30 ago): la fruta, la verdura y las salsas TAMBIÉN se cambian, siempre igualando
    // calorías, como todo lo demás. Valores por 100 g validados por él.
    fruta: [
      { n: 'Sandía', en: 'Watermelon', k: 30, p: 0.6, c: 7.6, g: 0.2 }, { n: 'Fresas', en: 'Strawberries', k: 32, p: 0.7, c: 7.7, g: 0.3 },
      { n: 'Melón', en: 'Melon', k: 34, p: 0.8, c: 8.2, g: 0.2 }, { n: 'Papaya', en: 'Papaya', k: 43, p: 0.5, c: 11, g: 0.3 },
      { n: 'Frutos rojos', en: 'Mixed berries', k: 45, p: 0.8, c: 10, g: 0.4 }, { n: 'Naranja', en: 'Orange', k: 47, p: 0.9, c: 12, g: 0.1 },
      { n: 'Piña', en: 'Pineapple', k: 50, p: 0.5, c: 13, g: 0.1 }, { n: 'Manzana', en: 'Apple', k: 52, p: 0.3, c: 14, g: 0.2 },
      { n: 'Mandarina', en: 'Tangerine', k: 53, p: 0.8, c: 13, g: 0.3 }, { n: 'Arándanos', en: 'Blueberries', k: 57, p: 0.7, c: 14, g: 0.3 },
      { n: 'Pera', en: 'Pear', k: 57, p: 0.4, c: 15, g: 0.1 }, { n: 'Mango', en: 'Mango', k: 60, p: 0.8, c: 15, g: 0.4 },
      { n: 'Kiwi', en: 'Kiwi', k: 61, p: 1.1, c: 15, g: 0.5 }, { n: 'Uvas', en: 'Grapes', k: 69, p: 0.7, c: 18, g: 0.2 },
      { n: 'Plátano', en: 'Banana', k: 89, p: 1.1, c: 23, g: 0.3 }
    ],
    verdura: [
      { n: 'Pepino', en: 'Cucumber', k: 15, p: 0.7, c: 3.6, g: 0.1 }, { n: 'Lechuga', en: 'Lettuce', k: 15, p: 1.4, c: 2.9, g: 0.2 },
      { n: 'Calabacín', en: 'Courgette', k: 17, p: 1.2, c: 3.1, g: 0.3 }, { n: 'Tomate', en: 'Tomato', k: 18, p: 0.9, c: 3.9, g: 0.2 },
      { n: 'Tomates cherry', en: 'Cherry tomatoes', k: 18, p: 0.9, c: 3.9, g: 0.2 }, { n: 'Ensalada mixta', en: 'Mixed salad', k: 20, p: 1.3, c: 3.5, g: 0.3 },
      { n: 'Espárragos', en: 'Asparagus', k: 20, p: 2.2, c: 3.9, g: 0.1 }, { n: 'Champiñones', en: 'Mushrooms', k: 22, p: 3.1, c: 3.3, g: 0.3 },
      { n: 'Espinacas', en: 'Spinach', k: 23, p: 2.9, c: 3.6, g: 0.4 }, { n: 'Berenjena', en: 'Aubergine', k: 25, p: 1, c: 6, g: 0.2 },
      { n: 'Pimiento rojo', en: 'Red pepper', k: 26, p: 1, c: 6, g: 0.3 }, { n: 'Judías verdes', en: 'Green beans', k: 31, p: 1.8, c: 7, g: 0.1 },
      { n: 'Brócoli', en: 'Broccoli', k: 34, p: 2.8, c: 7, g: 0.4 }, { n: 'Cebolla', en: 'Onion', k: 40, p: 1.1, c: 9, g: 0.1 },
      { n: 'Zanahoria', en: 'Carrot', k: 41, p: 0.9, c: 10, g: 0.2 }
    ],
    salsa: [
      { n: 'Salsa de tomate', en: 'Tomato sauce', k: 29, p: 1.3, c: 6, g: 0.2 }, { n: 'Salsa barbacoa 0%', en: 'Barbecue sauce 0%', k: 30, p: 0.6, c: 6.5, g: 0.1 },
      { n: 'Kétchup', en: 'Ketchup', k: 112, p: 1.3, c: 26, g: 0.1 }, { n: 'Salsa 4 quesos', en: 'Four cheese sauce', k: 120, p: 3, c: 4, g: 10 },
      { n: 'Salsa carbonara', en: 'Carbonara sauce', k: 128, p: 2.8, c: 4.4, g: 11 }, { n: 'Salsa roquefort', en: 'Roquefort sauce', k: 180, p: 4, c: 5, g: 16 },
      { n: 'Salsa de pesto', en: 'Pesto sauce', k: 300, p: 5, c: 3, g: 30 }, { n: 'Mayonesa', en: 'Mayonnaise', k: 680, p: 1, c: 0.6, g: 75 }
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
  // El nombre viene con marca ("Yogur Griego - Hacendado"): la marca se quita antes de clasificar,
  // si no, el alimento acaba en la familia equivocada según de dónde sea.
  function sinMarca(s) { return String(s == null ? '' : s).replace(/\s*-\s*[^-]+$/, '').trim(); }
  // Reglas de Alex (30 ago). El ORDEN importa: lo más específico primero.
  var REGLAS = [
    // Las aceitunas van antes: "Acei-tuna-s" contenía «tuna» y salían como proteína.
    [/aceituna|\bolives?\b/i, 'grasa'],
    [/burguer|burger|hamburguesa/i, 'prote'],
    // ojo con las palabras cortas: van con límite de palabra o pescan trozos de otras
    [/\bcarne|beef|pollo|chicken|pavo|turkey|cerdo|pork|ternera|salm[oó]n|\bat[uú]n\b|\btuna\b|merluza|hake|bacalao|\bcod\b|gambas|shrimp|prawns|huevo|\begg/i, 'prote'],
    [/\blomo\b|solomillo|\bfilete\b|bistec|steak|chuleta|costilla|ribs/i, 'prote'],
    [/whey|isolate|proteina en polvo|protein powder|impact/i, 'prote'],
    [/barrita de prote|protein bar/i, 'prote'],
    [/bebida de|leche de|\bmilk\b|\bleche\b|yogur|yoghurt|yogurt|kefir|batido|queso|cheese/i, 'lacteo'],
    [/granola|corn flakes|copos de|muesli|weetabix|tortitas? de arroz|tortas de arroz|rice cakes?|crema de arroz|cereal|gachas|porridge|avena|\boats?\b|oatmeal/i, 'carbo'],
    [/barra de pan|\bpan\b|\bbread\b|baguette|tostadas?|toast/i, 'carbo']
  ];
  function grupoDe(food) {
    var base = sinMarca(food.name);
    for (var r = 0; r < REGLAS.length; r++) { if (REGLAS[r][0].test(base)) return REGLAS[r][1]; }
    var n = nrm(base);
    for (var g in KW) { for (var i = 0; i < KW[g].length; i++) { if (n.indexOf(nrm(KW[g][i])) >= 0) return g; } }
    var kp = (food.p || 0) * 4, kc = (food.c || 0) * 4, kg = (food.g || 0) * 9, mx = Math.max(kp, kc, kg);
    if (mx <= 0) return null;
    if (mx === kg) return 'grasa'; if (mx === kp) return 'prote'; return 'carbo';
  }
  var SUST = { carbo: 1, prote: 1, grasa: 1, lacteo: 1, fruta: 1, verdura: 1, salsa: 1 };
  function esFijo(food) { var g = grupoDe(food); return !g || !SUST[g]; }
  function r1(x) { return Math.round(x * 10) / 10; }
  function alternativas(food, lang) {
    var g = grupoDe(food);
    if (!g || !SUST[g]) return null;
    var self = nrm(sinMarca(food.name));
    var k0 = (food.unit === 'g' && food.qty > 0) ? (food.kcal * 100 / food.qty) : 0;
    var list = ALT[g].filter(function (a) { return nrm(a.n).indexOf(self) < 0 && self.indexOf(nrm(a.n)) < 0; });
    if (k0 > 0) list = list.slice().sort(function (a, b) { return Math.abs(a.k - k0) - Math.abs(b.k - k0); });
    // Alex: por debajo de 15 g no se ofrece. Nadie pesa 4 g de salsa, y un cambio así confunde.
    var MIN_G = 15;
    return list.map(function (a) {
      return { a: a, grams: Math.round(food.kcal / (a.k / 100)) };
    }).filter(function (x) { return x.grams >= MIN_G; }).slice(0, 4).map(function (o) {
      var a = o.a, grams = o.grams;
      return {
        name: (lang === 'en' ? a.en : a.n), grams: grams, grupo: g,
        kcal: Math.round(grams * a.k / 100),          // kcal reales del sustituto (≈ objetivo)
        p: r1(grams * a.p / 100), c: r1(grams * a.c / 100), g: r1(grams * a.g / 100) // macros por detrás
      };
    });
  }
  w.EQUIV = { grupoDe: grupoDe, esFijo: esFijo, alternativas: alternativas };
})(typeof window !== 'undefined' ? window : globalThis);
