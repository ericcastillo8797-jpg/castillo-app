/* castillo-medidas.js — «A ojo»: las cantidades del plan en medidas caseras (Alex, 15 nov 2026).
   El plan sigue en gramos y es lo que sale siempre. Si el cliente toca «A ojo» en Nutrición, cada
   alimento sale en cucharadas, puñados, tazas, palmas o unidades, para el que no quiere pesar.
   Las calorías NO cambian: son las del plan.

   De dónde sale cada número (gramos por medida):
   - Cucharada, cucharadita, taza y unidades: medidas caseras de la base de alimentos del USDA
     (FoodData Central, «household measures»). Taza = 240 ml; cucharada = 15 ml; cucharadita = 5 ml.
   - Palma y puñado no existen como medida oficial (Alex: «no es una medida realista, pero algo que
     se le asemeje»). Se usa el método de la mano de los entrenadores: palma ≈ 100 g de carne o
     pescado; puñado ≈ 30 g de frutos secos (1 onza) y ≈ 75 g de fruta del bosque (media taza).
   - Lo que no tiene una medida fiable (chocolate, pizza, barritas, espaguetis en crudo…) se queda
     en gramos. Mejor gramos que una medida mala.
   Crudo o cocido (arroz, pasta, legumbre, avena) se distingue por las calorías por 100 g del plan. */
(function (w) {
  // nombre de cada medida: [singular ES, plural ES, singular EN, plural EN]
  var NOM = {
    taza: ['taza', 'tazas', 'cup', 'cups'], cda: ['cucharada', 'cucharadas', 'tbsp', 'tbsp'],
    cdta: ['cucharadita', 'cucharaditas', 'tsp', 'tsp'], punado: ['puñado', 'puñados', 'handful', 'handfuls'],
    palma: ['palma', 'palmas', 'palm', 'palms'], scoop: ['scoop', 'scoops', 'scoop', 'scoops'],
    huevo: ['huevo', 'huevos', 'egg', 'eggs'], clara: ['clara', 'claras', 'egg white', 'egg whites'],
    rebanada: ['rebanada', 'rebanadas', 'slice', 'slices'], loncha: ['loncha', 'lonchas', 'slice', 'slices'],
    tortita: ['tortita', 'tortitas', 'rice cake', 'rice cakes'], tortilla: ['tortilla', 'tortillas', 'tortilla', 'tortillas'],
    platano: ['plátano', 'plátanos', 'banana', 'bananas'], manzana: ['manzana', 'manzanas', 'apple', 'apples'],
    pera: ['pera', 'peras', 'pear', 'pears'], naranja: ['naranja', 'naranjas', 'orange', 'oranges'],
    mandarina: ['mandarina', 'mandarinas', 'mandarin', 'mandarins'], kiwi: ['kiwi', 'kiwis', 'kiwi', 'kiwis'],
    melocoton: ['melocotón', 'melocotones', 'peach', 'peaches'], ciruela: ['ciruela', 'ciruelas', 'plum', 'plums'],
    aguacate: ['aguacate', 'aguacates', 'avocado', 'avocados'], patata: ['patata', 'patatas', 'potato', 'potatoes'],
    boniato: ['boniato', 'boniatos', 'sweet potato', 'sweet potatoes'], tomate: ['tomate', 'tomates', 'tomato', 'tomatoes'],
    cherry: ['tomate cherry', 'tomates cherry', 'cherry tomato', 'cherry tomatoes'], pimiento: ['pimiento', 'pimientos', 'pepper', 'peppers'],
    zanahoria: ['zanahoria', 'zanahorias', 'carrot', 'carrots'], cebolla: ['cebolla', 'cebollas', 'onion', 'onions'],
    calabacin: ['calabacín', 'calabacines', 'zucchini', 'zucchini'], esparrago: ['espárrago', 'espárragos', 'spear', 'spears'],
    datil: ['dátil', 'dátiles', 'date', 'dates'], aceituna: ['aceituna', 'aceitunas', 'olive', 'olives'],
    alcachofa: ['alcachofa', 'alcachofas', 'artichoke', 'artichokes']
  };
  var VOL = { taza: 1, cda: 1, cdta: 1 };   // medidas de volumen: se pasan de una a otra (1 taza = 16 cdas = 48 cdtas)
  var PASO = { taza: 0.25, cda: 0.5, cdta: 0.5, punado: 0.5, palma: 0.5, scoop: 0.5 };
  // crudo/cocido por calorías por 100 g (kd): por encima de 250 es en crudo / en seco
  function seco(a, b) { return function (kd) { return kd > 250 ? a : b; }; }

  // [patrón, medida, gramos por medida (o función de kd), paso para unidades]. El ORDEN importa: lo concreto primero.
  // null = se queda en gramos.
  var R = [
    [/tortitas? de (arroz|maiz)|tortas de arroz|rice cakes?|corn cakes?/, 'tortita', 9, 1],
    // se quedan en gramos: bebidas sin calorías, platos hechos, dulces y cosas sin una medida fiable
    [/\bcaldo|broth|\bstock\b|consome|^(agua|water)\b|\bcafe\b|coffee|^te\b|\btea\b|infusion|manzanilla|refresco|\bsoda\b|cerveza|beer|\bvino\b|wine/, null],
    [/chocolate|\bchoco\b|pizza|hamburgues|burger|barrita|protein bar|\bbarra de (proteina|cereal)|\bbar\b|galleta|cookie|cracker|bruschett|sushi|lasana|lasagna|croqueta|empanada|helado|ice cream|tarta|cheesecake|cupcake|bizcocho|tiramisu|praline|nugget|patatas fritas|french fries|\bfries\b|\bchips\b|nachos|taco shell|tortilla de patata|spanish omelet|tortellini|ravioli|gnocchi|noquis|mac (and|&) cheese|weetabix|biscote|pan tostado|tostadas? integral|crispbread|\bwasa\b|\bpicos\b|bacon|beicon|chorizo|salami|pepperoni|salchich|fuet|mortadela|sausage|bratwurst|hot dog|frankfurt|meatball|albondiga|gelatina|pepinillo|pickle|encurtido|pimienta|black pepper|^sal\b|^salt\b|especias|spices|oregano|levadura|edulcorante|sweetener|stevia|sacarina/, null],
    // líquidos: leche, bebidas vegetales, kéfir, zumos, batidos → taza
    [/leche|\bmilk\b|bebida de|bebida vegetal|kefir|zumo|juice|batido|\bshake\b|smoothie|horchata/, 'taza', 244],
    [/mixed vegetables|verduras mixtas|menestra/, 'taza', 160],
    [/(spaghetti|espaguetis?|pasta|macarrones|tallarines|noodles) (a la |al |con |carbonara|bolo|alfredo|pesto)/, 'taza', 140],
    [/ensalada de frutas|fruit salad|macedonia/, 'taza', 150],
    [/lamb'?s lettuce/, 'punado', 30],
    [/yogur|yoghurt|yogurt|iogo?h?urt|\bskyr\b|\bquark\b|queso batido|requeson|cottage|petit|natillas|cuajada/, 'taza', 240],
    [/queso crema|queso de untar|queso untable|cream cheese|philadelphia/, 'cda', 14.5],
    [/parmesano|parmesan|grana padano|queso rallado|grated/, 'cda', 5],
    [/ricotta/, 'taza', 246],
    [/queso fresco|burgos|\bfeta\b|queso de cabra|goat cheese|mozzarella fresca|burrata/, 'taza', 150],
    [/queso|cheese|cheddar|gouda|emmental|\bedam\b|manchego|havarti|provolone|mozzarella/, 'loncha', 20, 0.5],
    [/\bclaras?\b|egg whites?/, 'clara', 33, 1],
    [/huevo|\beggs?\b|tortilla francesa|omelet/, 'huevo', 50, 0.5],
    [/jamon serrano|jamon iberico|serrano|prosciutto|cecina|cured ham/, 'loncha', 15, 1],
    [/jamon|\bham\b|fiambre|cold cuts?|\bdeli\b|lonchas|lunch meat|turkey slices/, 'loncha', 20, 1],
    // carne y pescado: palma de la mano (≈ 100 g)
    [/pollo|chicken|pavo|turkey|ternera|\bbeef\b|\bveal\b|steak|filete|solomillo|\blomo\b|cerdo|\bpork\b|cordero|\blamb\b|conejo|rabbit|\bcarne|\bmeat\b|mincemeat|salmon|\batun\b|\btuna\b|merluza|\bhake\b|bacalao|\bcod\b|whiting|whitefish|pescadilla|lubina|robalo|sea bass|dorada|bream|sardin|caballa|mackerel|trucha|trout|pez espada|swordfish|emperador|\brape\b|monkfish|lenguado|\bsole\b|tilapia|panga|gambas?|shrimp|prawns?|langostino|lobster|bogavante|langosta|mejillon|mussel|calamar|squid|sepia|pulpo|octopus|pescado|\bfish\b|tofu|seitan|tempeh|soja texturizada|cutlet|chuleta|costilla|\bribs?\b|entrecot/, 'palma', 100],
    [/^(aceite|aove)|\b(olive|coconut|sunflower|avocado|canola|vegetable|sesame|cooking) oil\b|^oil\b/, 'cda', 13.5],
    [/aceituna|\bolives?\b/, 'aceituna', 4, 1],
    [/crema de (cacahuetes?|cacahuate|almendras?|anacardos?|avellanas?|frutos secos)|mantequilla de (cacahuete|almendra)|peanut (butter|cream)|almond butter|nut butter|cashew butter|tahini|tahin/, 'cda', 16],
    [/mantequilla|\bbutter\b|margarina|margarine|\bghee\b/, 'cda', 14],
    [/\bmiel\b|honey/, 'cda', 21],
    [/mermelada|\bjam\b|jelly|confitura/, 'cda', 20],
    [/sirope|syrup/, 'cda', 20],
    [/azucar|\bsugar\b/, 'cda', 12.5],
    [/mayonesa|mayonnaise|\bmayo\b|alioli|aioli/, 'cda', 14],
    [/k[e]?tchup/, 'cda', 17],
    [/mostaza|mustard/, 'cda', 15],
    [/hummus|humus/, 'cda', 15],
    [/guacamole/, 'cda', 15],
    [/pesto/, 'cda', 16],
    [/pure de patata|pure de papa|mashed potato/, 'taza', 210],
    [/^pure\b|crema de verdura|crema de calabaza|sopa|soup|gazpacho|salmorejo/, 'taza', 240],
    [/tomate frito|tomato sauce|salsa de tomate|tomate triturado|crushed tomato|passata|tomato paste|tomate concentrado/, 'cda', 15.5],
    [/salsa|sauce|carbonara|bolonesa|bolognese|barbacoa|\bbbq\b|teriyaki|vinagre|vinegar|vinagreta|vinaigrette|dressing|alino/, 'cda', 16],
    [/cacao|cocoa|cola ?cao|nesquik/, 'cda', 6],
    [/canela|cinnamon/, 'cda', 7.8],
    [/whey|isolate|proteina en polvo|protein powder|\bimpact\b|caseina|casein/, 'scoop', 30],
    [/cacahuete en polvo|peanut (butter )?powder|\bpb2\b/, 'cda', 7],
    [/semillas|\bchia\b|linaza|\blino\b|flax|sesamo|sesame|pipas|(sunflower|pumpkin|hemp) seeds/, 'cda', 10],
    [/pasas|raisins|orejones|dried apricot|ciruelas? pasas?|prunes|arandanos secos|dried cranberr|fruta deshidratada|dried fruit/, 'punado', 30],
    [/almendra|almond|\bnuez|nueces|walnut|anacardo|cashew|cacahuete|cacahuate|peanut|pistacho|pistachio|avellana|hazelnut|frutos secos|\bnuts?\b|macadamia|pecan|\bpinones\b|pine nuts|mixed nuts/, 'punado', 30],
    [/tortillas?( de)? maiz|corn tortillas?/, 'tortilla', 26, 0.5],
    [/tortillas?.*(trigo|wheat|integral|mexicana)|\bwraps?\b|flour tortillas?|fajita|burrito/, 'tortilla', 49, 0.5],
    [/\bpan\b|bread|baguette|\btoast\b|pan de molde|panecillo|\bbollo\b|chapata|ciabatta/, 'rebanada', 30, 0.5],
    [/avena|\boats?\b|oatmeal|porridge|gachas/, 'taza', seco(81, 234)],
    [/granola/, 'taza', 120],
    [/muesli/, 'taza', 85],
    [/puffed rice|arroz inflado/, 'taza', 14],
    [/corn flakes|copos de maiz|cereales?\b|special k|cheerios|all ?bran|kellogg|fitness|crunchy/, 'taza', 30],
    [/crema de arroz|cream of rice/, 'taza', 173],
    [/harina|flour/, 'taza', 125],
    [/arroz|\brice\b/, 'taza', seco(185, 158)],
    [/espagueti|spaghetti|spaguetti|tallarin|noodle|fideo|linguine|tagliatelle/, 'taza', function (kd) { return kd > 320 ? null : 140; }],
    [/pasta|macarron|macaroni|penne|fusilli|plumas|helices|espirales/, 'taza', function (kd) { return kd > 320 ? 105 : 140; }],
    [/cuscus|cous ?cous/, 'taza', seco(173, 157)],
    [/quinoa|quinua/, 'taza', seco(170, 185)],
    [/bulgur/, 'taza', seco(140, 182)],
    [/lenteja|lentil/, 'taza', seco(192, 198)],
    [/garbanzo|chickpea/, 'taza', seco(200, 164)],
    [/judias verdes|judia verde|green beans?|vainas|ejotes/, 'taza', 110],
    [/alubia|judia|frijol|\bbeans?\b|kidney|pinto/, 'taza', seco(184, 177)],
    [/guisante|\bpeas\b/, 'taza', 145],
    [/edamame/, 'taza', 155],
    [/legumbre|legume/, 'taza', 170],
    [/boniato|batata|sweet ?potato|camote/, 'boniato', 130, 0.5],
    [/patata|potato|\bpapas?\b/, 'patata', 210, 0.5],
    [/platano macho|plantain/, 'platano', 180, 0.5],
    [/platano|banana|banano/, 'platano', 118, 0.5],
    [/manzana|\bapples?\b/, 'manzana', 180, 0.5],
    [/\bperas?\b|\bpears?\b/, 'pera', 178, 0.5],
    [/mandarina|mandarin|clementin|tangerine/, 'mandarina', 80, 0.5],
    [/naranja|orange/, 'naranja', 140, 0.5],
    [/kiwi/, 'kiwi', 75, 0.5],
    [/melocoton|peach|nectarin/, 'melocoton', 150, 0.5],
    [/ciruela|\bplums?\b/, 'ciruela', 66, 0.5],
    [/aguacate|avocado/, 'aguacate', 140, 0.25],
    [/datil|\bdates?\b/, 'datil', 8, 1],
    [/tomates? cherry|cherry tomato|tomatitos/, 'cherry', 17, 1],
    [/ensalada|salad/, 'taza', 55],
    [/fresa|strawberr|arandano|blueberr|frambuesa|raspberr|\bmoras?\b|blackberr|frutos rojos|frutos del bosque|berries|cereza|cherr|\buvas?\b|grapes?\b/, 'punado', 75],
    [/mango|papaya|\bpina\b|pineapple|melon|sandia|watermelon|cantaloupe|\bhigos?\b|\bfigs?\b|granada|pomegranate|pomelo|grapefruit|fruta|fruit/, 'taza', 150],
    [/tomate|tomato/, 'tomate', 123, 0.5],
    [/lechuga|lettuce|rucula|arugula|rocket|canonigos|espinaca|spinach|\bkale\b|col rizada|brotes|mezclum|mesclun|hojas verdes|greens|berro|watercress/, 'punado', 30],
    [/brocoli|broccoli/, 'taza', 90],
    [/coliflor|cauliflower|romanesco/, 'taza', 105],
    [/pimiento|bell pepper|\bpeppers?\b/, 'pimiento', 120, 0.5],
    [/zanahoria|carrot/, 'zanahoria', 61, 0.5],
    [/cebolla|onion/, 'cebolla', 110, 0.5],
    [/pepino|cucumber/, 'taza', 120],
    [/calabacin|zucchini|courgette/, 'calabacin', 200, 0.5],
    [/berenjena|eggplant|aubergine/, 'taza', 82],
    [/champinon|\bsetas?\b|mushroom/, 'taza', 70],
    [/esparrago|asparagus/, 'esparrago', 16, 1],
    [/alcachofa|artichoke/, 'alcachofa', 120, 0.5],
    [/maiz|\bcorn\b|sweetcorn/, 'taza', 154],
    [/verdura|vegetable|veggie|crudites|salteado|\bwok\b|calabaza|pumpkin|squash|\bcol\b|cabbage|repollo|apio|celery|remolacha|beet|puerro|leek/, 'taza', 130]
  ];

  function nrm(s) { return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }
  function sinMarca(s) { return String(s == null ? '' : s).replace(/\s+-\s+[^-]+$/, '').trim(); }
  // «sin azúcar», «without salt»… no dicen qué alimento es: se quitan antes de buscar (si no, el muesli sin azúcar salía en cucharadas de azúcar)
  var SIN = /\b(sin|without|no|zero|0%)\s+(azucar(es)?|sugar|sal|salt|lactosa|lactose|gluten)(\s+(anadidos?|added))?\b/g;

  // qué medida le toca a un alimento: { m, g, paso } o null
  function regla(nombre, kd) {
    var n = nrm(sinMarca(nombre)).replace(SIN, ' ').replace(/\s+/g, ' ').trim();
    if (!n) return null;
    for (var i = 0; i < R.length; i++) {
      if (!R[i][0].test(n)) continue;
      if (!R[i][1]) return null;
      var g = typeof R[i][2] === 'function' ? R[i][2](kd) : R[i][2];
      if (!g) return null;
      return { m: R[i][1], g: g, paso: R[i][3] || PASO[R[i][1]] || 0.5 };
    }
    return null;
  }

  var FR = { 0.25: '¼', 0.5: '½', 0.75: '¾' };
  function numero(v) {
    var e = Math.floor(v + 1e-9), f = Math.round((v - e) * 100) / 100;
    if (!f) return String(e);
    return (e ? e + ' ' : '') + (FR[f] || String(f).replace('0.', ','));
  }
  function redondea(v, paso) { var r = Math.round(v / paso) * paso; return r > 0 ? r : paso; }
  function texto(v, m, lang) {
    var nm = NOM[m] || [m, m, m, m], en = lang === 'en';
    return numero(v) + ' ' + (v > 1 ? nm[en ? 3 : 1] : nm[en ? 2 : 0]);
  }

  // aprox("Oats", 80, "g", 311, "es") → "1 taza". Si no hay medida fiable, null (se queda en gramos).
  function aprox(nombre, cantidad, unidad, kcal, lang) {
    var q = parseFloat(String(cantidad == null ? '' : cantidad).replace(',', '.'));
    var u = String(unidad || 'g').trim().toLowerCase();
    if (!(q > 0) || (u !== 'g' && u !== 'ml')) return null;
    var k = parseFloat(kcal), kd = (k >= 0 && q > 0) ? k * 100 / q : 0;
    var r = regla(nombre, kd);
    if (!r) return null;
    if (!VOL[r.m]) return texto(redondea(q / r.g, r.paso), r.m, lang);
    // volumen: todo a cucharadas y de ahí a la medida que se lea mejor
    var gCda = u === 'ml' ? 15 : (r.m === 'taza' ? r.g / 16 : r.m === 'cdta' ? r.g * 3 : r.g);
    var cdas = q / gCda, m = r.m;
    if (m === 'taza' && cdas / 16 < 0.19) m = 'cda';
    if (m === 'cda' && cdas > 8) m = 'taza';
    if (m === 'cda' && cdas < 0.75) m = 'cdta';
    if (m === 'taza') return texto(redondea(cdas / 16, PASO.taza), 'taza', lang);
    if (m === 'cdta') return texto(redondea(cdas * 3, PASO.cdta), 'cdta', lang);
    return texto(redondea(cdas, PASO.cda), 'cda', lang);
  }

  // "80 g" / "300 ml" → aprox(…) o el texto tal cual si no se puede
  function aproxTexto(nombre, qTxt, kcal, lang) {
    var mt = String(qTxt || '').trim().match(/^([\d.,]+)\s*(g|ml)$/i);
    if (!mt) return qTxt;
    return aprox(nombre, mt[1], mt[2], kcal, lang) || qTxt;
  }

  w.MEDIDAS = { aprox: aprox, aproxTexto: aproxTexto, regla: regla };
})(typeof window !== 'undefined' ? window : globalThis);
