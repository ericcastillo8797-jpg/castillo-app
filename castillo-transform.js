/* castillo-transform.js — Harbiz crudo (harbiz_clientes + programs) -> formas del diseño Castillo App.
   Puro: buildAppData(row, program) -> { DIET, EX, WK, VAR, DAYS, APPTS, MET, VID, WEIGHTS, PHOTOSETS, SESS, DATES, SHOTS, mealsSel, header }.
   Sin dependencias. Válido en navegador y en Node. */
(function (root) {
  'use strict';

  var WD = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  var WD1 = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  var WD3 = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
  var MO = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var ROM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  var MEAL_ES = { breakfast: 'Desayuno', morningSnack: 'Media mañana', lunch: 'Comida', snack: 'Merienda', preworkout: 'Pre-entreno', postworkout: 'Post-entreno', dinner: 'Cena' };
  var MEAL_H = { breakfast: '08:00', morningSnack: '11:00', lunch: '14:00', snack: '17:00', preworkout: '18:00', postworkout: '20:00', dinner: '21:30' };

  function ms(x) { return x && typeof x === 'object' && x.$date != null ? x.$date : x; }
  function d2(n) { return (n < 10 ? '0' : '') + n; }
  function ytId(u) {
    if (!u) return '';
    var m = String(u).match(/(?:v=|\/vi\/|\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    return m ? m[1] : '';
  }
  function comma(v) { if (v == null || v === '') return '—'; return String(v).replace('.', ','); }
  function startOfDay(dt) { return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()); }
  function mondayOf(dt) { var d = startOfDay(dt); var g = (d.getDay() + 6) % 7; d.setDate(d.getDate() - g); return d; }
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'w'; }

  function foodUnit(f) {
    var n = (f.name || '').toLowerCase();
    if (/milk|leche|water|agua|juice|zumo|yogur|yogurt|drink|bebida|batido|shake/.test(n)) return ' ml';
    return ' g';
  }

  function buildAppData(row, programs, ejercicios, registro) {
    row = row || {};
    var now = new Date();
    // programs: array de programas (o uno solo) -> fusionar todo el contenido
    var progList = Array.isArray(programs) ? programs : (programs ? [programs] : []);
    // ejercicios: catálogo del CRM (categoria_biblio + variantes que ordena Martín)
    var exLib = Array.isArray(ejercicios) ? ejercicios : [];
    var libById = {}, libByYt = {}, libByName = {};
    exLib.forEach(function (o) {
      libById[o.id] = o;
      var y = ytId(o.video_url || '');
      if (y) libByYt[y] = o;
      if (o.nombre) libByName[o.nombre.toLowerCase().trim()] = o;
    });

    // ---------- mapa titulo-workout -> ejercicios (fusionando TODOS los programas) ----------
    var workoutByTitle = {}; // title -> [exercises]
    var nutriTitleByProg = null; // para elegir plan de nutrición
    var weeks = []; // para localizar el plan de nutrición asignado
    progList.forEach(function (program) {
      var content = program && program.contenido ? program.contenido : (program || {});
      var pw = (content && content.weeks) || [];
      pw.forEach(function (wk) { weeks.push(wk); });
      pw.forEach(function (wk) {
        (wk.weekDays || []).forEach(function (day) {
          (day.dayTasks || []).forEach(function (t) {
            if (t.type === 'workout' && t.workout && Array.isArray(t.workout.exercises)) {
              if (!workoutByTitle[t.title]) workoutByTitle[t.title] = t.workout.exercises;
            }
          });
        });
      });
    });

    // ---------- EX (catálogo de ejercicios único por nombre) + WK (por título de workout) ----------
    var EX = [], VID = [], WK = {}, exByName = {}, seenVid = {};
    var exN = 0;
    function addEx(ex, grupo) {
      var name = ex.name_provisional || ex.name || 'Ejercicio';
      if (exByName[name]) return exByName[name];
      exN++;
      var id = 'e' + exN;
      var y = ytId(ex.url_provisional || ex.thumbnailUrl || '');
      var sets = ex.sets || (ex.series && ex.series.length) || 3;
      var target = ex.target || (ex.reps ? ex.reps + ' reps' : '');
      var reps = (target.match(/\d+([-–]\d+)?/) || ['—'])[0];
      var rest = ex.rest ? (String(ex.rest).replace(/[^0-9]/g, '') + ' s') : '—';
      var logs = [];
      for (var i = 0; i < sets; i++) logs.push([reps, '']);
      var rec = { id: id, n: name, y: y, p: sets + ' × ' + (target.replace(/\s*reps?/i, '') || reps), s: sets, rest: rest, l: logs, notes: ex.notes || '' };
      EX.push(rec); exByName[name] = rec;
      if (y && !seenVid[y]) { seenVid[y] = 1; VID.push({ t: name, g: grupo || 'Entreno', y: y }); }
      return rec;
    }
    Object.keys(workoutByTitle).forEach(function (title) {
      WK[slug(title)] = workoutByTitle[title].map(function (ex) {
        var rec = addEx(ex, title);
        return rec.n + '|' + rec.p;
      });
    });
    WK['descanso'] = [];

    // ---------- CALENDARIO -> eventos por dia ----------
    var events = Array.isArray(row.calendario_eventos) ? row.calendario_eventos : [];
    var byDay = {}; // 'YYYY-MM-DD' -> {workout, cardio, hasStats, hasPhoto}
    events.forEach(function (e) {
      if (e.removed) return;
      var dt = new Date(ms(e.date));
      var key = dt.getFullYear() + '-' + d2(dt.getMonth() + 1) + '-' + d2(dt.getDate());
      var slot = byDay[key] || (byDay[key] = { date: dt, items: [] });
      slot.items.push({ type: e.type, title: e.title, done: !!e.completed, dt: dt });
    });

    // ---------- DAYS (semana actual) ----------
    var mon = mondayOf(now);
    var todayKey = now.getFullYear() + '-' + d2(now.getMonth() + 1) + '-' + d2(now.getDate());
    // numero de semana ISO aprox
    var jan1 = new Date(now.getFullYear(), 0, 1);
    var week = Math.ceil((((startOfDay(now) - jan1) / 86400000) + jan1.getDay() + 1) / 7);
    var DAYS = [];
    for (var i = 0; i < 7; i++) {
      var dt = new Date(mon); dt.setDate(mon.getDate() + i);
      var key = dt.getFullYear() + '-' + d2(dt.getMonth() + 1) + '-' + d2(dt.getDate());
      var slot = byDay[key];
      var wkItem = slot && slot.items.filter(function (x) { return x.type === 'workout'; })[0];
      var cardio = slot && slot.items.filter(function (x) { return x.type === 'cardio'; })[0];
      var isToday = key === todayKey;
      var wkKey = wkItem ? slug(wkItem.title) : 'descanso';
      var title = wkItem ? wkItem.title : (cardio ? cardio.title : 'Descanso');
      var status = isToday ? 'Hoy' : (dt < startOfDay(now) ? (wkItem && wkItem.done ? 'Completado' : (wkItem ? 'No realizado' : 'Descanso')) : 'Programado');
      var nCount = wkItem && WK[wkKey] ? (wkItem.done ? WK[wkKey].length + ' de ' + WK[wkKey].length : '—') : '—';
      var hh = wkItem ? d2(wkItem.dt.getHours()) + ':' + d2(wkItem.dt.getMinutes()) : '';
      DAYS.push({
        d: dt.getDate(), w: WD1[dt.getDay()], long: WD[dt.getDay()] + ' ' + dt.getDate() + ' de ' + MO[dt.getMonth()],
        rom: ROM[i], t: title, s: status, wk: wkKey, n: nCount,
        ses: wkItem ? (hh + ' · Su domicilio') : (cardio ? cardio.title : 'Sin sesión'),
        dot: isToday ? 2 : (wkItem && wkItem.done ? 1 : 0), today: isToday
      });
    }

    // ---------- APPTS (proximas sesiones) ----------
    var APPTS = [];
    Object.keys(byDay).map(function (k) { return byDay[k]; })
      .filter(function (s) { return s.date >= startOfDay(now); })
      .sort(function (a, b) { return a.date - b.date; })
      .forEach(function (s) {
        if (APPTS.length >= 3) return;
        var w = s.items.filter(function (x) { return x.type === 'workout'; })[0];
        if (!w) return;
        APPTS.push({ w: WD3[s.date.getDay()], d: d2(s.date.getDate()), t: 'Sesión de entrenamiento', sub: 'Alex Castillo · Su domicilio', h: d2(w.dt.getHours()) + ':' + d2(w.dt.getMinutes()) });
      });

    // ---------- DIET (plan de nutrición activo) ----------
    var plans = (row.nutricion && row.nutricion.nutritionPlans) || [];
    // el plan referenciado por el programa (task nutrition), o el mas reciente
    var nutriTitle = null;
    weeks.some(function (wk) {
      return (wk.weekDays || []).some(function (day) {
        return (day.dayTasks || []).some(function (t) { if (t.type === 'nutrition' && t.title) { nutriTitle = t.title; return true; } return false; });
      });
    });
    var plan = null;
    if (nutriTitle) plan = plans.filter(function (p) { return p.name === nutriTitle; })[0];
    if (!plan) plan = plans.slice().sort(function (a, b) { return ms(b.updatedAt || 0) - ms(a.updatedAt || 0); })[0];
    var DIET = [], mealsSel = {};
    if (plan && Array.isArray(plan.meals)) {
      plan.meals.forEach(function (meal, idx) {
        var id = 'm' + (idx + 1);
        var opts = (meal.option || []).map(function (op) {
          var foods = (op.foodInTheMeal || []).map(function (f) {
            var qty = f.valuesQuantity && f.valuesQuantity.quantity != null ? f.valuesQuantity.quantity : '';
            return f.name + ':' + qty + foodUnit(f);
          });
          var recs = (op.recipes || []).map(function (r) { return (r.name || 'Receta') + ':1 ud'; });
          return foods.concat(recs).join(';');
        }).filter(function (s) { return s; });
        if (!opts.length) return;
        DIET.push({ id: id, h: MEAL_H[meal.type] || '', n: MEAL_ES[meal.type] || meal.mealDescription || ('Comida ' + (idx + 1)), o: opts });
        mealsSel[id] = typeof meal.selectedOption === 'number' ? meal.selectedOption : 0;
      });
    }

    // ---------- MET / WEIGHTS ----------
    var metrics = (row.evolution && row.evolution.metrics) || [];
    function metVal(m) { return m.current != null && m.current !== '' && m.current !== 0 ? m.current : (m.data && m.data.length ? m.data[m.data.length - 1].y : null); }
    function metPrev(m) {
      var p = null;
      if (m.data && m.data.length >= 2) p = m.data[m.data.length - 2].y;
      else if (m.data && m.data.length === 1) p = m.data[0].y;
      var pn = parseFloat(String(p).replace(',', '.'));
      var cn = parseFloat(String(metVal(m)).replace(',', '.'));
      // sin delta falso: prev vacío/cero o implausible (>18% del actual) -> usa el actual
      if (p == null || isNaN(pn) || pn === 0 || (!isNaN(cn) && cn && Math.abs(pn - cn) / cn > 0.18)) return metVal(m);
      return p;
    }
    var fields = metrics.filter(function (m) { return metVal(m) != null; }).map(function (m) {
      return { k: slug(m.name), l: m.name, u: m.unit || '', v: comma(metVal(m)), p: comma(metPrev(m)) };
    });
    var MET = fields.length ? [{ g: 'Composición y medidas', f: fields }] : [];

    // serie de peso para el mini-grafico
    var wm = metrics.filter(function (m) { return /peso|weight/i.test(m.name); })[0];
    var WEIGHTS = [];
    if (wm) {
      var cur = parseFloat(String(wm.current).replace(',', '.'));
      (wm.data || []).forEach(function (p) {
        var n = parseFloat(String(p.y).replace(',', '.'));
        // descarta puntos implausibles (>18% del actual = dato basura)
        if (!isNaN(n) && n > 0 && (isNaN(cur) || !cur || Math.abs(n - cur) / cur < 0.18)) WEIGHTS.push(n);
      });
      if (!isNaN(cur) && cur > 0) WEIGHTS.push(cur);
    }
    if (WEIGHTS.length === 1) WEIGHTS = [WEIGHTS[0], WEIGHTS[0]];

    // ---------- PHOTOSETS (fotos de progreso) ----------
    var photos = (row.evolution && row.evolution.photos) || [];
    var PHOTOSETS = photos.slice().sort(function (a, b) { return ms(b.date) - ms(a.date); }).slice(0, 3).map(function (p) {
      var dt = new Date(ms(p.date));
      return { w: 'Semana ' + Math.ceil((dt.getDate()) / 7 + (dt.getMonth()) * 4.34), date: d2(dt.getDate()) + ' ' + MO[dt.getMonth()].slice(0, 3), kg: wm && wm.current ? comma(wm.current) + ' kg' : '' };
    });
    var SHOTS = ['Frontal', 'Espalda', 'Lateral'];
    var SESS = photos.slice().sort(function (a, b) { return ms(b.date) - ms(a.date); }).slice(0, 5).map(function (p) { var dt = new Date(ms(p.date)); return dt.getDate() + ' ' + MO[dt.getMonth()].slice(0, 3); });
    var DATES = (wm && wm.data ? wm.data : []).slice().reverse().slice(0, 10).map(function (p) { var dt = new Date(ms(p.t)); return dt.getDate() + ' ' + MO[dt.getMonth()].slice(0, 3); });
    if (!DATES.length) DATES = SESS.slice();

    // ---------- VAR (variantes que ordena Martín) por ejercicio del entreno ----------
    function libOf(exRec) {
      return (exRec.y && libByYt[exRec.y]) || libByName[(exRec.n || '').toLowerCase().trim()] || null;
    }
    var VAR = {};
    EX.forEach(function (exRec) {
      var lib = libOf(exRec);
      if (!lib || !Array.isArray(lib.variantes) || !lib.variantes.length) return;
      var list = lib.variantes.map(function (vid) {
        var v = libById[vid]; if (!v) return null;
        return v.nombre + '|' + ytId(v.video_url || '');
      }).filter(Boolean);
      if (list.length) VAR[exRec.id] = list;
    });

    // ---------- VID (Biblioteca técnica): por grupo real si Martín ya categorizó ----------
    var categorizados = exLib.filter(function (o) { return o.categoria_biblio; });
    if (categorizados.length) {
      var seenV = {};
      VID = categorizados.map(function (o) {
        return { t: o.nombre, g: o.categoria_biblio, y: ytId(o.video_url || '') };
      }).filter(function (v) { var k = v.g + '|' + v.t; if (seenV[k]) return false; seenV[k] = 1; return true; });
    }

    // ---------- logsInit: registro de hoy (lo que apuntó el cliente o el entrenador) ----------
    var logsInit = {};
    if (registro && Array.isArray(registro.ejercicios)) {
      registro.ejercicios.forEach(function (re) {
        var ex = EX.filter(function (e) { return e.n === re.nombre; })[0];
        if (ex && Array.isArray(re.series)) logsInit[ex.id] = re.series.map(function (s) { return { r: s.reps || '', w: s.peso || '', done: !!s.done }; });
      });
    }

    // ---------- header (día de hoy) ----------
    var todayDay = DAYS.filter(function (d) { return d.today; })[0] || DAYS[0];
    var header = {
      nombre: [row.nombre, row.apellido].filter(Boolean).join(' ') || (row.email || ''),
      email: row.email || '',
      week: week, dayNum: now.getDate(), month: MO[now.getMonth()], monthCap: MO[now.getMonth()].charAt(0).toUpperCase() + MO[now.getMonth()].slice(1), year: now.getFullYear(), weekday: WD[now.getDay()],
      nMeals: DIET.length, nMetrics: fields.length, nPhotos: PHOTOSETS.length
    };

    return {
      DIET: DIET, EX: EX, WK: WK, VAR: VAR, DAYS: DAYS, APPTS: APPTS, MET: MET, VID: VID,
      WEIGHTS: WEIGHTS, PHOTOSETS: PHOTOSETS, SHOTS: SHOTS, SESS: SESS, DATES: DATES,
      mealsSel: mealsSel, header: header, logsInit: logsInit
    };
  }

  root.buildAppData = buildAppData;
  if (typeof module !== 'undefined' && module.exports) module.exports = { buildAppData: buildAppData };
})(typeof window !== 'undefined' ? window : globalThis);
