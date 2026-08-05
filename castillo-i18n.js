/* castillo-i18n.js — traducción ES/EN para la app del cliente.
   window.I18N.food(nombre, lang) / meal(nombre, lang) / t(textoES, lang).
   La app guarda el idioma; la traducción ocurre en el render, sin re-fetch. */
(function (w) {
  'use strict';

  // ---- Alimentos (clave = nombre original en minúsculas) ----
  var FOOD = {
    'carbonara sauce': { es: 'Salsa carbonara', en: 'Carbonara sauce' },
    'alcachofa': { es: 'Alcachofa', en: 'Artichoke' },
    'almond butter': { es: 'Crema de almendras', en: 'Almond butter' },
    'almonds': { es: 'Almendras', en: 'Almonds' },
    'apple': { es: 'Manzana', en: 'Apple' },
    'arroz blanco cocido': { es: 'Arroz blanco cocido', en: 'Cooked white rice' },
    'arroz blanco crudo': { es: 'Arroz blanco crudo', en: 'Raw white rice' },
    'asparagus': { es: 'Espárragos', en: 'Asparagus' },
    'atún claro al natural - hacendado': { es: 'Atún claro al natural - Hacendado', en: 'Light tuna in water - Hacendado' },
    'avocado': { es: 'Aguacate', en: 'Avocado' },
    'banana': { es: 'Plátano', en: 'Banana' },
    'barra de cereal': { es: 'Barra de cereal', en: 'Cereal bar' },
    'barra de proteína': { es: 'Barra de proteína', en: 'Protein bar' },
    'batido + proteinas frutos del bosque - danone': { es: 'Batido + Proteínas Frutos del Bosque - Danone', en: 'Forest Fruits Protein Shake - Danone' },
    'beef fillet': { es: 'Filete de ternera', en: 'Beef fillet' },
    'beef steak': { es: 'Filete de ternera', en: 'Beef steak' },
    'bell peppers': { es: 'Pimientos', en: 'Bell peppers' },
    'black beans (canned)': { es: 'Frijoles negros (lata)', en: 'Black beans (canned)' },
    'blueberries': { es: 'Arándanos', en: 'Blueberries' },
    'boniato': { es: 'Boniato', en: 'Sweet potato' },
    'broccoli': { es: 'Brócoli', en: 'Broccoli' },
    'brocoli': { es: 'Brócoli', en: 'Broccoli' },
    'broiled veal cutlet or steak': { es: 'Chuleta o filete de ternera a la parrilla', en: 'Broiled veal cutlet or steak' },
    'cacahuete en polvo desgrasado - hacendado': { es: 'Cacahuete en polvo desgrasado - Hacendado', en: 'Defatted peanut powder - Hacendado' },
    'cacao desgrasado - valor': { es: 'Cacao desgrasado - Valor', en: 'Defatted cocoa - Valor' },
    'cacao en polvo': { es: 'Cacao en polvo', en: 'Cocoa powder' },
    'carne picada pollo - eroski sannia': { es: 'Carne picada de pollo - Eroski Sannia', en: 'Ground chicken - Eroski Sannia' },
    'carrots': { es: 'Zanahorias', en: 'Carrots' },
    'champiñones': { es: 'Champiñones', en: 'Mushrooms' },
    'cheese': { es: 'Queso', en: 'Cheese' },
    'cherry tomatoes': { es: 'Tomates cherry', en: 'Cherry tomatoes' },
    'chicken breast': { es: 'Pechuga de pollo', en: 'Chicken breast' },
    'chickpeas (garbanzo beans, bengal gram) (mature seeds, without salt, cooked, boiled)': { es: 'Garbanzos (cocidos, sin sal)', en: 'Chickpeas (cooked, without salt)' },
    'chocolate negro 70% - valor': { es: 'Chocolate Negro 70% - Valor', en: 'Dark Chocolate 70% - Valor' },
    'cinnamon': { es: 'Canela', en: 'Cinnamon' },
    'cooked chickpeas': { es: 'Garbanzos cocidos', en: 'Cooked chickpeas' },
    'cooked lentils': { es: 'Lentejas cocidas', en: 'Cooked lentils' },
    'cooked mixed vegetables (corn, lima beans, peas, green beans and carrots, from canned, fat added in cooking)': { es: 'Verduras variadas cocidas (maíz, judías, guisantes, judías verdes y zanahoria)', en: 'Cooked mixed vegetables (corn, beans, peas, green beans, carrots)' },
    'copos de avena - mercadona': { es: 'Copos de Avena - Mercadona', en: 'Oat Flakes - Mercadona' },
    "corn flakes - kellogg's": { es: "Corn Flakes - Kellogg's", en: "Corn Flakes - Kellogg's" },
    'couscous': { es: 'Cuscús', en: 'Couscous' },
    'crema de almendras - myprotein': { es: 'Crema de Almendras - MyProtein', en: 'Almond Butter - MyProtein' },
    'dry couscous': { es: 'Cuscús seco', en: 'Dry couscous' },
    'egg': { es: 'Huevo', en: 'Egg' },
    'ensalada mixta': { es: 'Ensalada mixta', en: 'Mixed salad' },
    'espaguetis - hacendado': { es: 'Espaguetis - Hacendado', en: 'Spaghetti - Hacendado' },
    'filete de pavo adobado - hacendado': { es: 'Filete de Pavo Adobado - Hacendado', en: 'Marinated Turkey Fillet - Hacendado' },
    'fresh pasta': { es: 'Pasta fresca', en: 'Fresh pasta' },
    'frutos rojos - lidl': { es: 'Frutos Rojos - Lidl', en: 'Red Berries - Lidl' },
    'gachas': { es: 'Gachas', en: 'Porridge' },
    'granola': { es: 'Granola', en: 'Granola' },
    'greek yogurt': { es: 'Yogur griego', en: 'Greek yogurt' },
    'hake loin': { es: 'Lomo de merluza', en: 'Hake loin' },
    'ham, roasted': { es: 'Jamón asado', en: 'Roasted ham' },
    'jamón cocido': { es: 'Jamón cocido', en: 'Cooked ham' },
    'jamón serrano - serrano': { es: 'Jamón Serrano - Serrano', en: 'Serrano Ham - Serrano' },
    'jelly': { es: 'Gelatina', en: 'Jelly' },
    'judías verdes': { es: 'Judías verdes', en: 'Green beans' },
    'kefir': { es: 'Kéfir', en: 'Kefir' },
    'ketchup': { es: 'Kétchup', en: 'Ketchup' },
    'ketchup - heinz': { es: 'Kétchup - Heinz', en: 'Ketchup - Heinz' },
    'leche desnatada': { es: 'Leche desnatada', en: 'Skimmed milk' },
    'leche desnatada - dia': { es: 'Leche Desnatada - DIA', en: 'Skimmed Milk - DIA' },
    'leche desnatada - hacendado': { es: 'Leche Desnatada - Hacendado', en: 'Skimmed Milk - Hacendado' },
    'leche entera - hacendado': { es: 'Leche Entera - Hacendado', en: 'Whole Milk - Hacendado' },
    'lettuce': { es: 'Lechuga', en: 'Lettuce' },
    'low fat milk': { es: 'Leche desnatada', en: 'Low fat milk' },
    'macaroni': { es: 'Macarrones', en: 'Macaroni' },
    'macarrones - hacendado': { es: 'Macarrones - Hacendado', en: 'Macaroni - Hacendado' },
    'mango': { es: 'Mango', en: 'Mango' },
    'mangos': { es: 'Mangos', en: 'Mangos' },
    'mashed potato': { es: 'Puré de patata', en: 'Mashed potato' },
    'menestra de verduras': { es: 'Menestra de verduras', en: 'Mixed vegetables' },
    'mushrooms': { es: 'Champiñones', en: 'Mushrooms' },
    'oatmeal': { es: 'Avena', en: 'Oatmeal' },
    'oats': { es: 'Avena', en: 'Oats' },
    'olive oil': { es: 'Aceite de oliva', en: 'Olive oil' },
    'onions': { es: 'Cebollas', en: 'Onions' },
    'papaya': { es: 'Papaya', en: 'Papaya' },
    'parmesan cheese (grated)': { es: 'Queso parmesano (rallado)', en: 'Parmesan cheese (grated)' },
    'patata cruda': { es: 'Patata cruda', en: 'Raw potato' },
    'peanut butter': { es: 'Crema de cacahuete', en: 'Peanut butter' },
    'pepino': { es: 'Pepino', en: 'Cucumber' },
    'pesto sauce': { es: 'Salsa pesto', en: 'Pesto sauce' },
    'potato': { es: 'Patata', en: 'Potato' },
    'prawns': { es: 'Gambas', en: 'Prawns' },
    'puré de verduras': { es: 'Puré de verduras', en: 'Vegetable purée' },
    'red sweet pepper': { es: 'Pimiento rojo', en: 'Red sweet pepper' },
    'salad': { es: 'Ensalada', en: 'Salad' },
    'salmon': { es: 'Salmón', en: 'Salmon' },
    'salsa carbonara - carrefour': { es: 'Salsa Carbonara - Carrefour', en: 'Carbonara Sauce - Carrefour' },
    'salsa carbonara - gallo': { es: 'Salsa Carbonara - Gallo', en: 'Carbonara Sauce - Gallo' },
    'smooth peanut butter (without salt)': { es: 'Crema de cacahuete suave (sin sal)', en: 'Smooth peanut butter (without salt)' },
    'spaghetti': { es: 'Espaguetis', en: 'Spaghetti' },
    'spaghetti - gallo': { es: 'Espaguetis - Gallo', en: 'Spaghetti - Gallo' },
    'spaguetti - hacendado': { es: 'Espaguetis - Hacendado', en: 'Spaghetti - Hacendado' },
    'strawberries': { es: 'Fresas', en: 'Strawberries' },
    'strawberry': { es: 'Fresa', en: 'Strawberry' },
    'strawberry banana smoothie': { es: 'Batido de fresa y plátano', en: 'Strawberry banana smoothie' },
    'sweet potato': { es: 'Boniato', en: 'Sweet potato' },
    'ternera picada - hacendado': { es: 'Ternera Picada - Hacendado', en: 'Ground Beef - Hacendado' },
    'tomato sauce': { es: 'Salsa de tomate', en: 'Tomato sauce' },
    'tomatoes': { es: 'Tomates', en: 'Tomatoes' },
    'tuna': { es: 'Atún', en: 'Tuna' },
    'turkey breast': { es: 'Pechuga de pavo', en: 'Turkey breast' },
    'turkey breast meat': { es: 'Pechuga de pavo', en: 'Turkey breast meat' },
    'turkey meat': { es: 'Carne de pavo', en: 'Turkey meat' },
    'walnuts': { es: 'Nueces', en: 'Walnuts' },
    "weetabix - kellogg's": { es: "Weetabix - Kellogg's", en: "Weetabix - Kellogg's" },
    'white beans (mature seeds, without salt, cooked, boiled)': { es: 'Judías blancas (cocidas, sin sal)', en: 'White beans (cooked, without salt)' },
    'white bread': { es: 'Pan blanco', en: 'White bread' },
    'white rice': { es: 'Arroz blanco', en: 'White rice' },
    'whiting': { es: 'Pescadilla', en: 'Whiting' },
    'yogur griego': { es: 'Yogur griego', en: 'Greek yogurt' },
    'yogur sabor fresa - hacendado': { es: 'Yogur Sabor Fresa - Hacendado', en: 'Strawberry Yogurt - Hacendado' }
  };

  // ---- Nombres de comidas ----
  var MEAL = {
    'Desayuno': { es: 'Desayuno', en: 'Breakfast' },
    'Almuerzo': { es: 'Almuerzo', en: 'Lunch' },
    'Comida': { es: 'Comida', en: 'Lunch' },
    'Merienda': { es: 'Merienda', en: 'Snack' },
    'Cena': { es: 'Cena', en: 'Dinner' },
    'Media mañana': { es: 'Media mañana', en: 'Mid-morning' },
    'Post-entreno': { es: 'Post-entreno', en: 'Post-workout' },
    'Pre-entreno': { es: 'Pre-entreno', en: 'Pre-workout' },
    'Recena': { es: 'Recena', en: 'Late snack' }
  };

  // ---- Interfaz (clave = texto en español) ----
  var UI = {
    // navegación / pantallas
    'Hoy': 'Today', 'Agenda': 'Schedule', 'Evolución': 'Progress', 'Ajustes': 'Settings',
    'Plan de hoy': "Today's plan", 'Configuración': 'Settings', 'Dieta': 'Diet',
    // Home
    'Tareas de hoy': "Today's tasks", 'Resumen semanal': 'Weekly summary', 'completado': 'completed',
    'Cumplimiento global': 'Overall completion', 'objetivo / día': 'target / day', 'Métricas personales': 'Personal metrics',
    'Peso, medidas y foto': 'Weight, measurements & photo', 'Registrar cardio': 'Log cardio',
    'Registrar entreno': 'Log workout', 'Registrar pauta alimenticia': 'Log nutrition plan',
    'Cardio': 'Cardio', 'Caminar': 'Walk', 'Entrenamiento': 'Workout', 'Cardio marcado': 'Cardio logged',
    'Entrenos': 'Workouts', 'Métricas': 'Metrics',
    // Agenda
    'Pauta alimenticia': 'Nutrition plan', 'Nutrición': 'Nutrition', 'Marca lo que has comido': 'Mark what you ate', 'Registrar evolución': 'Record progress', 'Día de descanso — sin actividades asignadas.': 'Rest day — no activities assigned.',
    'Descanso': 'Rest', 'Sin sesión': 'No session',
    'Hoy · editable': 'Today · editable', 'Registro cerrado': 'Closed', 'Programada': 'Scheduled',
    'Marque cada comida con la opción que ha tomado.': 'Mark each meal with the option you had.',
    'Lo registrado en días anteriores no puede modificarse.': "Previous days' logs can't be edited.",
    'Podrá registrarla el mismo día.': 'You can log it on the day.',
    'Se abre ese día': 'Opens that day', 'Sin registrar — toque para elegir': 'Not logged — tap to choose',
    'Opción': 'Option', 'OPCIÓN': 'OPTION', 'Elija': 'Choose', 'una opción': 'an option',
    'Ya registrado · no editable': 'Already logged · locked', 'Comida registrada': 'Meal logged',
    // estados
    'Completado': 'Completed', 'No realizado': 'Not done', 'Programado': 'Scheduled',
    // Evolución
    'Peso corporal': 'Body weight', 'variación': 'change', 'Composición y medidas': 'Body composition',
    'Grasa corporal': 'Body fat', 'Cuello': 'Neck', 'Hombros': 'Shoulders', 'Pecho': 'Chest',
    'Cintura': 'Waist', 'Cadera': 'Hip', 'Bíceps izquierdo': 'Left biceps', 'Bíceps derecho': 'Right biceps',
    'Brazo izquierdo': 'Left arm', 'Brazo derecho': 'Right arm', 'Pierna izquierda': 'Left leg', 'Pierna derecha': 'Right leg',
    'Muslo izquierdo': 'Left thigh', 'Muslo derecho': 'Right thigh', 'Gemelo': 'Calf', 'Abdomen': 'Abdomen',
    'Progreso en el ejercicio': 'Exercise progress',
    'Aún no hay entrenos registrados.': 'No workouts logged yet.',
    'Cuando su entrenador registre las series y cargas, verá aquí su progreso en cada ejercicio.': "When your coach logs your sets and loads, you'll see your progress for each exercise here.",
    'Elija': 'Choose', 'Variante en uso · ver otras': 'Variant in use · see others',
    'sesión': 'session', 'sesiones': 'sessions',
    'Registro semanal': 'Weekly log', 'Registrado cada semana en su check-in.': 'Logged weekly at your check-in.',
    'Serie más pesada': 'Heaviest set', 'Historial de cargas': 'Load history',
    // entreno
    'Finalizar': 'Finish', 'series': 'series', 'Series': 'Sets', 'Repeticiones': 'Reps', 'Peso': 'Weight',
    'Peso de la sesión anterior': 'Last session weight', 'Descanso': 'Rest',
    // ajustes / integraciones / nutrición
    'Normal': 'Normal', 'Grande': 'Large', 'Más grande': 'Larger', 'Tamaño de texto': 'Text size',
    'Sincroniza tu actividad': 'Sync your activity', 'Conecta tu dispositivo para volcar tu actividad automáticamente': 'Connect your device to sync your activity automatically', 'Conectar': 'Connect',
    'Tus objetivos diarios': 'Your daily targets', 'Calorías': 'Calories', 'Proteínas': 'Protein', 'Carbohidratos': 'Carbs', 'Grasas': 'Fats',
    'completado': 'completed', 'No puedo hacer este ejercicio': "I can't do this exercise",
    'Variante en uso · ver otras': 'Variant in use · see others', 'Vídeo de técnica': 'Technique video',
    'Volver al ejercicio original': 'Back to original exercise', 'Si no dispone del material': "If you don't have the equipment",
    'Entreno registrado · enviado al equipo': 'Workout logged · sent to your coach',
    'Comenzar': 'Start', 'Continuar': 'Continue', 'ejercicios': 'exercises', 'reps': 'reps',
    // Ajustes
    'Apariencia': 'Appearance', 'Cuenta': 'Account', 'Cerrar sesión': 'Log out', 'Aplicación': 'App',
    'Oscuro': 'Dark', 'Claro': 'Light', 'Correo': 'Email', 'Plan': 'Plan', 'Sistema completo': 'Full system',
    'Descargar dieta': 'Download diet', 'Imprimir dieta': 'Print diet', 'Compartir dieta': 'Share diet',
    'Revisión semanal': 'Weekly review', 'Viernes 19:00': 'Friday 19:00', 'Evaluación mensual': 'Monthly evaluation', 'Primer lunes': 'First Monday',
    'Idioma': 'Language', 'Español': 'Spanish', 'Inglés': 'English',
    'Toque la imagen para añadir su fotografía': 'Tap the image to add your photo',
    'Ver animación de apertura': 'View opening animation', 'Check-in semanal': 'Weekly check-in',
    'Enviar check-in': 'Send check-in', 'Listo': 'Done', 'Total': 'Total',
    // acceso
    'Acceder': 'Sign in', 'Acceder con Face ID': 'Sign in with Face ID', 'Saltar': 'Skip',
    'Introduce tu correo y contraseña': 'Enter your email and password',
    'Correo o contraseña incorrectos': 'Wrong email or password'
  };

  // ---- Fechas (traduce meses/días/semana dentro de una cadena) ----
  var MONTHS = { enero: 'January', febrero: 'February', marzo: 'March', abril: 'April', mayo: 'May', junio: 'June', julio: 'July', agosto: 'August', septiembre: 'September', octubre: 'October', noviembre: 'November', diciembre: 'December', ene: 'Jan', feb: 'Feb', mar: 'Mar', abr: 'Apr', may: 'May', jun: 'Jun', jul: 'Jul', ago: 'Aug', sep: 'Sep', oct: 'Oct', nov: 'Nov', dic: 'Dec' };
  var WEEKD = { lunes: 'Monday', martes: 'Tuesday', 'miércoles': 'Wednesday', miercoles: 'Wednesday', jueves: 'Thursday', viernes: 'Friday', 'sábado': 'Saturday', sabado: 'Saturday', domingo: 'Sunday' };
  function tdate(s, lang) {
    if (lang !== 'en' || !s) return s;
    var out = String(s);
    Object.keys(WEEKD).forEach(function (k) { out = out.replace(new RegExp('\\b' + k + '\\b', 'gi'), WEEKD[k]); });
    Object.keys(MONTHS).forEach(function (k) { out = out.replace(new RegExp('\\b' + k + '\\b', 'gi'), MONTHS[k]); });
    out = out.replace(/ de /g, ' ').replace(/\bSemana\b/g, 'Week').replace(/\bsemana\b/g, 'week').replace(/\bdel\b/g, '').replace(/\bal\b/g, 'to').replace(/\s{2,}/g, ' ').trim();
    return out;
  }

  function pick(map, key, lang) {
    var e = map[key];
    if (!e) return key;
    if (typeof e === 'string') return lang === 'en' ? e : key; // UI: valor = inglés; ES = clave
    return e[lang] || e.es || key;
  }

  // normaliza: quita espacios raros (non-breaking  ), colapsa espacios, minúsculas
  function nk(s) { return String(s == null ? '' : s).replace(/ /g, ' ').replace(/\s+/g, ' ').trim().toLowerCase(); }
  w.I18N = {
    // food(): si no está en el diccionario, devuelve el original tal cual
    food: function (name, lang) {
      if (!name) return name;
      var e = FOOD[nk(name)];
      return e ? (e[lang] || e.es || name) : name;
    },
    meal: function (name, lang) {
      if (!name) return name;
      // busca por clave normalizada en MEAL (que está keyed por nombre en español)
      var keys = Object.keys(MEAL); for (var i = 0; i < keys.length; i++) { if (nk(keys[i]) === nk(name)) return (lang === 'en' ? MEAL[keys[i]].en : MEAL[keys[i]].es) || name; }
      return name;
    },
    t: function (str, lang) { if (lang !== 'en') return str; return UI[str] != null ? UI[str] : str; },
    date: tdate
  };
})(typeof window !== 'undefined' ? window : globalThis);
