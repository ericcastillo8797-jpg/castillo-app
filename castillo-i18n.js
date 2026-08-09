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
    'Tu progreso': 'Your progress', 'Primeras': 'First', 'Últimas': 'Latest', 'Desliza para ver frontal, lateral y espalda': 'Swipe to see front, side and back',
    'Empezó en': 'Started at', 'ahora': 'now',
    'Medidas de ese día': 'Measurements that day', 'Enviada en su check-in semanal. Queda archivada para su consulta: no puede modificarse ni eliminarse.': 'Submitted in your weekly check-in. Archived for your reference: it cannot be edited or deleted.', 'en ese check-in': 'in that check-in',
    'Ver todas las apps': 'See all apps', 'Ver menos': 'See less',
    'Cambiar alimento': 'Swap food', 'Mismas calorías, distinto alimento. Toca el que prefieras.': 'Same calories, different food. Tap the one you prefer.', 'Food swapped': 'Food swapped', 'Alimento cambiado': 'Food swapped',
    'Registrada': 'Registered', 'Registrar esta': 'Register this', 'Registrar': 'Register',
    'Toca la opción marcada para desmarcarla': 'Tap the selected option to unselect it', 'Toca ✓ para desmarcar': 'Tap ✓ to unselect',
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
    'completado': 'completed', 'No puedo hacer este ejercicio': "I can't do this exercise", 'Variantes de este ejercicio': 'Variations of this exercise',
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
    'Mi perfil': 'My profile', 'Aplicaciones conectadas': 'Connected apps', 'Visibilidad': 'Display',
    'Datos personales': 'Personal details', 'Toca para cambiar la foto': 'Tap to change photo',
    'Nombre': 'First name', 'Apellidos': 'Last name', 'Nombre público': 'Display name', 'Fecha de nacimiento': 'Date of birth', 'Prefijo': 'Country code', 'Teléfono': 'Phone', 'Email': 'Email', 'Contraseña': 'Password',
    'Tu nombre': 'Your first name', 'Tus apellidos': 'Your last name', 'Cómo quieres que te llamen': 'How you want to be called',
    'El email y la contraseña se gestionan con tu cuenta; para cambiarlos, contacta con tu entrenador.': 'Email and password are managed with your account; to change them, contact your trainer.',
    'Tu email no se puede cambiar aquí: es el identificador de tu cuenta. Si lo necesitas, contacta con tu entrenador.': "Your email can't be changed here: it's your account identifier. If you need to, contact your trainer.",
    'Cambiar': 'Change', 'Cambiar contraseña': 'Change password', 'Nueva contraseña': 'New password', 'Repite la contraseña': 'Repeat password', 'Guardar': 'Save',
    'Comida a domicilio, hecha por tus calorías. Solo regístrala.': 'Home-delivered meal, made to your calories. Just log it.',
    'Comida libre': 'Free meal', '¿Comiste fuera? Búscalo y regístralo.': 'Ate out? Search it and log it.', '¿Qué comiste?': 'What did you eat?', 'Buscar alimento…': 'Search food…', 'Buscar': 'Search', 'Buscando…': 'Searching…', 'Añadir': 'Add', 'Sin resultados. Prueba otro nombre.': 'No results. Try another name.', 'Tu comida': 'Your meal', 'Registrar comida libre': 'Log free meal', 'Registrar cheat meal': 'Log cheat meal', 'Resultados': 'Results', 'Recientes': 'Recent',
    'Resumen del mes': 'Monthly summary', 'Sin datos este mes': 'No data this month', 'Recuento del mes': "Month's count", 'Día a día': 'Day by day', 'Objetivo': 'Goal', 'pasos': 'steps', 'días': 'days', 'Hecho': 'Done', 'No': 'No', 'medidas': 'measures', 'sesión': 'session', 'sesiones': 'sessions', 'Progresión de peso por ejercicio este mes': 'Weight progression per exercise this month', 'Qué comió cada día y recuento del mes': "What you ate each day and the month's count", 'Check-ins registrados este mes': 'Check-ins logged this month',
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
  // nombres de ejercicios (tabla + entrenos, ES/mixto) -> EN. Clave normalizada SIN acentos.
  function nkx(s) { return nk(s).normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  var EX_EN = {
    'abdominales (sit ups)': 'Sit-ups', 'abdominales con press militar': 'Sit-ups with overhead press', 'abdominales cruzados': 'Cross crunches',
    'abducciones hombro posterior en poleas': 'Cable rear delt abduction', 'aductor en maquina': 'Adductor machine',
    'aperturas con mancuernas (banco inclinado)': 'Incline dumbbell flyes', 'aperturas con mancuernas (banco plano)': 'Flat dumbbell flyes',
    'aperturas de pecho (en casa)': 'Chest flyes (at home)', 'aperturas de pecho en trx': 'TRX chest flyes',
    'bench press with bar': 'Barbell bench press', 'biceps con mancuerna alterno': 'Alternating dumbbell curls', 'biceps con mancuernas (alterno)': 'Alternating dumbbell curls',
    'biceps en banco scott': 'Preacher curls', 'biceps en polea baja con barra': 'Low cable bar curls', 'biceps en polea baja con cuerda': 'Low cable rope curls',
    'biceps en polea con barra': 'Cable bar curls', 'biceps en polea con cuerda': 'Cable rope curls', 'bird dog': 'Bird dog',
    'bulgarian squat': 'Bulgarian split squat', 'burpees': 'Burpees', 'burpees con salto lateral': 'Burpees with lateral jump',
    'cierres con banco inclinado en poleas': 'Incline cable flyes', 'cierres en banco inclinado con mancuerna': 'Incline dumbbell flyes',
    'cierres en polea para pectoral inferior': 'Low cable flyes (lower chest)', 'cierres pectoral en maquina pec deck': 'Pec deck machine flyes',
    'contractor de pecho (pec deck)': 'Pec deck (chest fly machine)', 'cruces en polea': 'Cable crossover', 'cruces en polea en banco inclinado': 'Incline cable crossover',
    'crunch cruzado': 'Cross-body crunch', 'curl bayesiano': 'Bayesian curl', 'curl bayesian en polea': 'Bayesian cable curl',
    'curl femoral sentado': 'Seated leg curl', 'curl femoral tumbado en maquina': 'Lying leg curl machine', 'curl femoral en maquina tumbado': 'Lying leg curl machine',
    'deltoides posterior en polea': 'Rear delt cable', 'dips on asisted machines': 'Assisted machine dips', 'dominadas': 'Pull-ups',
    'dominadas agarre neutro': 'Neutral-grip pull-ups', 'dominadas en maquina asistida': 'Assisted machine pull-ups',
    'elevacion de pierna alterna': 'Alternating leg raise', 'elevacion de piernas desde el suelo': 'Lying leg raises',
    'elevacion de talon': 'Calf raises', 'elevacion de talones': 'Calf raises', 'elevacion de talones sentado en maquina': 'Seated calf raise machine',
    'elevacion unilateral en polea': 'Single-arm cable raise', 'elevaciones frontales con mancuernas': 'Dumbbell front raises',
    'elevaciones laterales': 'Lateral raises', 'elevaciones laterales con mancuerna apoyando el pecho en banco': 'Chest-supported dumbbell lateral raises',
    'elevaciones laterales con mancuerna de pie': 'Standing dumbbell lateral raises', 'elevaciones laterales con mancuernas para deltoides posterior': 'Rear delt dumbbell raises',
    'elevaciones laterales con pecho apoyado en banco': 'Chest-supported lateral raises', 'elevaciones para hombros posterior sentado con mancuerna': 'Seated dumbbell rear delt raises',
    'elevaciones unilateral laterales en polea baja': 'Single-arm low cable lateral raises', 'escaladores (mountain climbers)': 'Mountain climbers',
    'estiramiento buenos dias (good morning stretch)': 'Good morning stretch', 'estiramiento de la cobra (cobra stretch)': 'Cobra stretch',
    'estiramiento de pose del nino (child pose stretch)': "Child's pose stretch", 'estiramiento del perro (downward dog stretch)': 'Downward dog stretch',
    'extension de cuadriceps': 'Leg extension', 'face pull': 'Face pull', 'facepull': 'Face pull',
    'flexiones': 'Push-ups', 'flexiones declinadas': 'Decline push-ups', 'flexiones en trx': 'TRX push-ups', 'flexiones inclinadas': 'Incline push-ups',
    'fondos de triceps (dips)': 'Triceps dips', 'fondos en maquina asistida': 'Assisted machine dips', 'hip thrust': 'Hip thrust', 'hip thrust con barra': 'Barbell hip thrust',
    'hollow position': 'Hollow hold', 'hup thrust con barra': 'Barbell hip thrust', 'isquio en maquina sentado': 'Seated leg curl machine',
    'jalon al pecho': 'Lat pulldown', 'jalon al pecho (agarre cerrado)': 'Close-grip lat pulldown', 'jalon al pecho agarre prono ancho (wide grip lat pulldown)': 'Wide-grip lat pulldown',
    'jalon al pecho con barra': 'Barbell lat pulldown', 'jalon al pecho en maquina': 'Machine lat pulldown', 'jalon al pecho unilateral': 'Single-arm lat pulldown', 'jalon unilateral': 'Single-arm lat pulldown',
    'jumping jacks': 'Jumping jacks', 'jumping lunges': 'Jumping lunges', 'leg extension': 'Leg extension', 'maquina de abductores': 'Abductor machine',
    'maquina gemelo sentado': 'Seated calf machine', 'maquina press banca plano': 'Flat bench press machine', 'mountain climbers': 'Mountain climbers',
    'patada de gluteo': 'Glute kickback', 'patada de gluteo en polea': 'Cable glute kickback', 'patada lateral de gluteo': 'Lateral glute kickback',
    'peso muerto con barra': 'Barbell deadlift', 'peso muerto con mancuerna': 'Dumbbell deadlift', 'peso muerto con mancuernas': 'Dumbbell deadlift', 'peso muerto rumano': 'Romanian deadlift',
    'plancha abdominal': 'Plank', 'plancha activa (toque de hombro)': 'Active plank (shoulder taps)', 'plancha lateral': 'Side plank', 'posicion hollow': 'Hollow hold',
    'prensa': 'Leg press', 'prensa de piernas': 'Leg press', 'press banca con barra': 'Barbell bench press', 'press banca con mancuerna': 'Dumbbell bench press',
    'press banca inclinado con barra': 'Incline barbell bench press', 'press de banca con barra': 'Barbell bench press', 'press de banca con mancuernas': 'Dumbbell bench press',
    'press de banca declinado con barra': 'Decline barbell bench press', 'press de banca en maquina': 'Machine bench press', 'press en suelo con mancuerna': 'Dumbbell floor press',
    'press inclinado (en casa)': 'Incline press (at home)', 'press inclinado con barra': 'Incline barbell press', 'press inclinado con mancuerna': 'Incline dumbbell press', 'press inclinado con mancuernas': 'Incline dumbbell press',
    'press militar': 'Overhead press', 'press militar (en casa)': 'Overhead press (at home)', 'press militar con mancuerna': 'Dumbbell overhead press', 'press militar con mancuernas': 'Dumbbell overhead press',
    'press pallof': 'Pallof press', 'press z': 'Z press', 'pullover abdominal': 'Ab pullover', 'pullover con mancuerna': 'Dumbbell pullover',
    'pullover en polea': 'Cable pullover', 'pullover en polea alta con cuerda': 'High cable rope pullover', 'pullover en trx': 'TRX pullover', 'push ups': 'Push-ups',
    'rare shoulder in cable': 'Rear delt cable', 'remo agarre en t': 'T-bar row', 'remo al menton': 'Upright row', 'remo al menton con mancuernas (en casa)': 'Dumbbell upright row (at home)',
    'remo con barra': 'Barbell row', 'remo con barra (agarre supino)': 'Underhand barbell row', 'remo con mancuerna unilateral con mano apoyada en el banco': 'Single-arm dumbbell row (hand on bench)',
    'remo con mancuerna unilateral rodilla apoyada en banco': 'Single-arm dumbbell row (knee on bench)', 'remo con mancuerna unilateral sin apoyos': 'Unsupported single-arm dumbbell row',
    'remo en maquina': 'Machine row', 'remo en polea (agarre supino)': 'Underhand cable row', 'remo en polea baja/gironda': 'Low cable / Gironda row', 'remo en t': 'T-bar row', 'remo en t en maquina': 'Machine T-bar row', 'remo en trx': 'TRX row',
    'remo gironda': 'Gironda row', 'remo gironda unilateral': 'Single-arm Gironda row', 'remo unilateral (en casa)': 'Single-arm row (at home)', 'remo unilateral con mancuerna': 'Single-arm dumbbell row',
    'remo unilateral con mancuerna con rodilla en banco': 'Single-arm dumbbell row (knee on bench)', 'remo unilateral en maquina': 'Single-arm machine row', 'remo unilateral en polea baja': 'Single-arm low cable row',
    'row machine': 'Machine row', 'salto al cajon': 'Box jump', 'sentadilla a una pierna en trx': 'TRX single-leg squat', 'sentadilla bulgara': 'Bulgarian split squat',
    'sentadilla con barra': 'Barbell squat', 'sentadilla con press (mancuerna)': 'Dumbbell squat to press', 'sentadilla con salto': 'Jump squat', 'sentadilla con salto en trx': 'TRX jump squat',
    'sentadilla en maquina smith': 'Smith machine squat', 'sentadilla en maquina smith con banco': 'Smith machine squat with bench', 'sentadilla trasera': 'Back squat',
    'squat en multipower': 'Smith machine squat', 'squat en multipower con banco': 'Smith machine squat with bench', 'squat press con mancuerna': 'Dumbbell squat to press', 'squat smith machine': 'Smith machine squat',
    'subida al cajon': 'Box step-up', 'swing ruso': 'Kettlebell swing', 'triceps con peso corporal': 'Bodyweight triceps', 'triceps en polea alta con barra': 'High cable bar triceps pushdown',
    'triceps en polea alta con cuerda': 'High cable rope triceps pushdown', 'triceps en polea con barra': 'Cable bar triceps pushdown', 'triceps en polea con cuerda': 'Cable rope triceps pushdown',
    'unilateral dumbbell row with knee in bench': 'Single-arm dumbbell row (knee on bench)', 'unilateral gironda row': 'Single-arm Gironda row',
    'zancada lateral': 'Lateral lunge', 'zancadas con salto': 'Jumping lunges'
  };
  w.I18N = {
    // exercise(): nombre de ejercicio ES/mixto -> EN; si no está, devuelve el original
    exercise: function (name, lang) { if (lang !== 'en' || !name) return name; var e = EX_EN[nkx(name)]; return e || name; },
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
