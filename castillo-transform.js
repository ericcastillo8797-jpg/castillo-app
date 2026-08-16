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

  function buildAppData(row, programs, ejercicios, registros, comidaRegs, checkinRegs, comidaLibre) {
    // kcal de cheat meals por día y comida: comLibreByDate['YYYY-MM-DD'][nombreComida] = kcal total
    var comLibreByDate = {};
    (Array.isArray(comidaLibre) ? comidaLibre : []).forEach(function (r) {
      var f = (r.fecha || '').slice(0, 10); if (!f) return;
      var kc = (r.alimentos || []).reduce(function (s, a) { return s + (parseInt(a.kcal, 10) || 0); }, 0);
      (comLibreByDate[f] || (comLibreByDate[f] = {}))[r.comida || ''] = ((comLibreByDate[f] || {})[r.comida || ''] || 0) + kc;
    });
    // 4º arg puede ser un solo registro (compat) o el histórico completo (array)
    var regList = Array.isArray(registros) ? registros : (registros ? [registros] : []);
    // 5º arg: histórico de comida_registros (para el cumplimiento SEMANAL de nutrición)
    var comList = Array.isArray(comidaRegs) ? comidaRegs : (comidaRegs ? [comidaRegs] : []);
    var comByDate = {};
    comList.forEach(function (cr) { var k = (cr.fecha || '').slice(0, 10); if (k) comByDate[k] = cr.comidas || {}; });
    // 6º arg: check-ins del cliente (peso/medidas) -> key -> [{fecha,val}] ordenado
    var chkList = (Array.isArray(checkinRegs) ? checkinRegs : []).filter(function (c) { return c.fecha; }).slice().sort(function (a, b) { return (a.fecha < b.fecha ? -1 : 1); });
    var chkByKey = {};
    chkList.forEach(function (c) { var v = c.valores || {}; Object.keys(v).forEach(function (k) { if (v[k] != null && v[k] !== '') { (chkByKey[k] || (chkByKey[k] = [])).push({ fecha: (c.fecha || '').slice(0, 10), val: v[k] }); } }); });
    // días en los que el cliente pasó un check-in (métricas o fotos) -> cuentan como "métricas hechas"
    var chkDates = {}, chkWeeks = {}; chkList.forEach(function (c) { if ((c.valores && Object.keys(c.valores).length) || (c.fotos && Object.keys(c.fotos).length)) { var _f = (c.fecha || '').slice(0, 10); chkDates[_f] = true; var _dd = new Date(_f + 'T00:00:00'); if (!isNaN(_dd)) chkWeeks[_dd.getFullYear() + '-W' + isoWeek(_dd)] = true; } });
    // por-día: qué se registró (medidas vs fotos) para marcar cada tarea por separado
    var chkMedDates = {}, chkFotoDates = {};
    chkList.forEach(function (c) { var _f = (c.fecha || '').slice(0, 10); if (c.valores && Object.keys(c.valores).length) chkMedDates[_f] = true; if (c.fotos && Object.keys(c.fotos).length) chkFotoDates[_f] = true; });
    function wkKeyOf(dt) { return dt.getFullYear() + '-W' + isoWeek(dt); }
    function miles(n) { return String(n == null ? '' : n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
    function cardioSub(item) { var p = item && item.config && item.config.pasos; return p ? (miles(p) + ' pasos') : 'Cardio'; }
    // sub del cardio mostrando los pasos REALES de Apple Salud hacia el objetivo (ej. "5.547 / 12.000 pasos")
    function cardioSubReal(item, hechos) {
      var p = item && item.config && item.config.pasos;
      if (hechos != null && hechos !== '') return miles(hechos) + (p ? ' / ' + miles(p) : '') + ' pasos';
      return p ? (miles(p) + ' pasos') : 'Cardio';
    }
    row = row || {};
    // "now" en la ZONA HORARIA DEL CLIENTE (row.tz; presencial = Miami). Así el día/semana/hoy van por su zona, no la del dispositivo.
    var now;
    try { now = new Date(new Date().toLocaleString('en-US', { timeZone: (row.tz || 'America/New_York') })); if (isNaN(now)) now = new Date(); }
    catch (e) { now = new Date(); }
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
      slot.items.push({ type: e.type, title: e.title, done: !!e.completed, dt: dt, config: e.config });
    });

    // ---------- REGISTROS DEL CLIENTE por fecha (lo que él marca en la app: entreno / cardio) ----------
    var regByDate = {};
    regList.forEach(function (r) {
      var k = (r.fecha || '').slice(0, 10); if (!k) return;
      var o = regByDate[k] || (regByDate[k] = { workout: false, cardio: false, pasos: null });
      if (r.estado === 'completado' || (Array.isArray(r.ejercicios) && r.ejercicios.length)) o.workout = true;
      if (r.cardio) o.cardio = true;
      if (r.pasos != null) o.pasos = r.pasos;   // pasos reales de Apple Salud
    });

    // ---------- DAYS / WEEKS (semana actual + navegación) ----------
    var mon = mondayOf(now);
    var todayKey = now.getFullYear() + '-' + d2(now.getMonth() + 1) + '-' + d2(now.getDate());
    // numero de semana ISO aprox
    var jan1 = new Date(now.getFullYear(), 0, 1);
    var week = Math.ceil((((startOfDay(now) - jan1) / 86400000) + jan1.getDay() + 1) / 7);
    // construye una semana (7 días) a partir de su lunes
    function buildWeek(monDate) {
      var out = [];
      for (var i = 0; i < 7; i++) {
        var dt = new Date(monDate); dt.setDate(monDate.getDate() + i);
        var key = dt.getFullYear() + '-' + d2(dt.getMonth() + 1) + '-' + d2(dt.getDate());
        var slot = byDay[key];
        var sItems = (slot && slot.items) || [];
        var wkItem = sItems.filter(function (x) { return x.type === 'workout'; })[0];
        var cardio = sItems.filter(function (x) { return x.type === 'cardio'; })[0];
        var statsItem = sItems.filter(function (x) { return x.type === 'bodyStats'; })[0];
        var photoItem = sItems.filter(function (x) { return x.type === 'bodyPhoto'; })[0];
        var nutriItem = sItems.filter(function (x) { return x.type === 'nutritionPlan' || x.type === 'nutrition'; })[0];
        // lo que el cliente ya registró ese día cuenta como hecho (aunque el entrenador no lo haya marcado)
        var regDay = regByDate[key] || {};
        if (wkItem && regDay.workout) wkItem.done = true;
        if (cardio && regDay.cardio) cardio.done = true;
        var isToday = key === todayKey;
        var wkKey = wkItem ? slug(wkItem.title) : 'descanso';
        var title = wkItem ? wkItem.title : (cardio ? cardio.title : 'Descanso');
        var status = isToday ? 'Hoy' : (dt < startOfDay(now) ? (wkItem && wkItem.done ? 'Completado' : (wkItem ? 'No realizado' : 'Descanso')) : 'Programado');
        var nCount = wkItem && WK[wkKey] ? (wkItem.done ? WK[wkKey].length + ' de ' + WK[wkKey].length : '—') : '—';
        var hh = wkItem ? d2(wkItem.dt.getHours()) + ':' + d2(wkItem.dt.getMinutes()) : '';
        // lista de actividades del día (como Harbiz > Planificación): métricas (foto incluida) / cardio / entreno
        var acts = [];
        if (statsItem) acts.push({ type: 'medidas', label: 'Métricas personales · medidas', sub: 'Peso y medidas', done: !!((statsItem && statsItem.done) || chkMedDates[key]) });
        if (photoItem) acts.push({ type: 'fotos', label: 'Métricas personales · fotos', sub: 'Frontal, lateral y espalda', done: !!((photoItem && photoItem.done) || chkFotoDates[key]) });
        if (cardio) acts.push({ type: 'cardio', label: cardio.title || 'Caminar', sub: cardioSubReal(cardio, regDay.pasos), pasos: (cardio.config && cardio.config.pasos) || '', pasosHechos: (regDay.pasos != null ? regDay.pasos : ''), done: !!cardio.done });
        if (wkItem) acts.push({ type: 'workout', label: wkItem.title, sub: (WK[wkKey] ? WK[wkKey].length + ' ejercicios' : 'Entrenamiento'), done: !!wkItem.done, wk: wkKey });
        // Nutrición del programa (con el título TAL CUAL lo puso el entrenador en el CRM, ej. "P.S Alimentación aumento músculo M.1")
        if (nutriItem) acts.push({ type: 'nutricion', label: nutriItem.title || 'Nutrición', sub: 'Marca lo que has comido', done: !!nutriItem.done });
        out.push({
          d: dt.getDate(), w: WD1[dt.getDay()], long: WD[dt.getDay()] + ' ' + dt.getDate() + ' de ' + MO[dt.getMonth()],
          rom: ROM[i], t: title, s: status, wk: wkKey, n: nCount, acts: acts,
          fecha: dt.getFullYear() + '-' + d2(dt.getMonth() + 1) + '-' + d2(dt.getDate()),
          ses: wkItem ? 'Su domicilio' : (cardio ? cardio.title : 'Sin sesión'),
          dot: isToday ? 2 : (wkItem && wkItem.done ? 1 : 0), today: isToday
        });
      }
      var last = new Date(monDate); last.setDate(monDate.getDate() + 6);
      var lbl = (monDate.getMonth() === last.getMonth())
        ? (MO[monDate.getMonth()].charAt(0).toUpperCase() + MO[monDate.getMonth()].slice(1) + ' ' + monDate.getFullYear())
        : (MO[monDate.getMonth()].slice(0, 3) + '–' + MO[last.getMonth()].slice(0, 3) + ' ' + last.getFullYear());
      return { label: lbl, subtitle: 'Semana del ' + monDate.getDate() + ' al ' + last.getDate(), mon: monDate.getTime(), days: out };
    }
    var DAYS = buildWeek(mon).days;
    // rango de semanas: desde el lunes del evento más antiguo al del más nuevo, unido a semana actual ±1, con tope
    var evMondays = events.filter(function (e) { return !e.removed && e.date; }).map(function (e) { return mondayOf(new Date(ms(e.date))).getTime(); });
    var minMon = mon.getTime(), maxMon = mon.getTime();
    evMondays.forEach(function (t) { if (t < minMon) minMon = t; if (t > maxMon) maxMon = t; });
    var oneWk = 7 * 86400000;
    minMon = Math.min(minMon, mon.getTime() - oneWk);
    maxMon = Math.max(maxMon, mon.getTime() + oneWk);
    var WEEKS = [], curWeekIdx = 0, guard = 0;
    for (var wt = minMon; wt <= maxMon && guard < 40; wt += oneWk, guard++) {
      var wobj = buildWeek(new Date(wt));
      if (wt === mon.getTime()) curWeekIdx = WEEKS.length;
      WEEKS.push(wobj);
    }
    // Si la semana actual está vacía (aún no empieza el plan), abre la agenda en la primera semana CON tareas
    // (así el cliente ve el programa que le acaban de asignar aunque empiece en unos días).
    var _wkHasContent = function (w) { return w && w.days && w.days.some(function (d) { return (d.acts || []).length > 0; }); };
    if (WEEKS[curWeekIdx] && !_wkHasContent(WEEKS[curWeekIdx])) {
      for (var _wi = curWeekIdx + 1; _wi < WEEKS.length; _wi++) { if (_wkHasContent(WEEKS[_wi])) { curWeekIdx = _wi; break; } }
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
        APPTS.push({ w: WD3[s.date.getDay()], d: d2(s.date.getDate()), t: 'Sesión de entrenamiento', sub: 'Alex Castillo · Su domicilio', h: '' });
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
            var kcal = f.valuesQuantity && f.valuesQuantity.energy != null ? Math.round(f.valuesQuantity.energy) : '';
            return f.name + ':' + qty + foodUnit(f) + '@@' + kcal;
          });
          var recs = (op.recipes || []).map(function (r) {
            var rk = r.valuesQuantity && r.valuesQuantity.energy != null ? Math.round(r.valuesQuantity.energy) : (r.energy != null ? Math.round(r.energy) : '');
            return (r.name || 'Receta') + ':1 ud@@' + rk;
          });
          return foods.concat(recs).join(';');
        }).filter(function (s) { return s; });
        if (!opts.length) return;
        // ox: mismos alimentos pero como OBJETOS con macros (para las equivalencias/sustituciones)
        var optsX = (meal.option || []).map(function (op) {
          return (op.foodInTheMeal || []).map(function (f) {
            var vq = f.valuesQuantity || {};
            return { name: f.name || '', qty: (vq.quantity != null ? +vq.quantity : 0), unit: foodUnit(f), kcal: (vq.energy != null ? +vq.energy : 0), p: +vq.protein || 0, c: +vq.carbs || 0, g: +vq.fat || 0 };
          });
        });
        var okcal = opts.map(function (str) { return String(str || '').split(';').reduce(function (s, p) { var n = parseInt(p.split('@@')[1], 10); return s + (isNaN(n) ? 0 : n); }, 0); });
        DIET.push({ id: id, h: '', n: MEAL_ES[meal.type] || meal.mealDescription || ('Comida ' + (idx + 1)), o: opts, ox: optsX, okcal: okcal });
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
    function isoWeek(dt) { var j = new Date(dt.getFullYear(), 0, 1); return Math.ceil((((startOfDay(dt) - j) / 86400000) + j.getDay() + 1) / 7); }
    function weekRange(dt) { var m0 = mondayOf(dt), e = new Date(m0); e.setDate(m0.getDate() + 6); return m0.getDate() + ' ' + MO[m0.getMonth()].slice(0, 3) + ' – ' + e.getDate() + ' ' + MO[e.getMonth()].slice(0, 3); }
    var fields = metrics.filter(function (m) { return metVal(m) != null && !/grasa|body\s?fat/i.test(m.name || ''); }).map(function (m) {
      // histórico REAL de la métrica (más reciente primero) con etiqueta de semana + rango de fechas
      var pts = (m.data || []).filter(function (p) { return p && p.t != null && p.y != null && !isNaN(parseFloat(String(p.y).replace(',', '.'))); })
        .map(function (p) { return { t: ms(p.t), y: p.y }; });
      pts.push({ t: now.getTime(), y: metVal(m) });
      pts.sort(function (a, b) { return b.t - a.t; });
      var seen = {}, hist = [];
      pts.forEach(function (p) { var dt = new Date(p.t); var wk = isoWeek(dt); if (seen[wk]) return; seen[wk] = 1; hist.push({ v: comma(p.y), raw: parseFloat(String(p.y).replace(',', '.')), weekLabel: 'Semana ' + wk, range: weekRange(dt) }); });
      hist = hist.slice(0, 12);
      return { k: slug(m.name), l: m.name, u: m.unit || '', v: comma(metVal(m)), p: comma(metPrev(m)), hist: hist };
    });
    var MET = fields.length ? [{ g: 'Composición y medidas', f: fields }] : [];

    // serie de peso para el mini-grafico
    var wm = metrics.filter(function (m) { return /peso|weight/i.test(m.name); })[0];
    var WEIGHTS = [], WDATES = [];
    function fmtShort(tv) { var dt = new Date(ms(tv)); return dt.getDate() + ' ' + MO[dt.getMonth()].slice(0, 3); }
    if (wm) {
      var cur = parseFloat(String(wm.current).replace(',', '.'));
      (wm.data || []).forEach(function (p) {
        var n = parseFloat(String(p.y).replace(',', '.'));
        // descarta puntos implausibles (>18% del actual = dato basura)
        if (!isNaN(n) && n > 0 && (isNaN(cur) || !cur || Math.abs(n - cur) / cur < 0.18)) { WEIGHTS.push(n); WDATES.push(p.t ? fmtShort(p.t) : ''); }
      });
      if (!isNaN(cur) && cur > 0) { WEIGHTS.push(cur); WDATES.push(fmtShort(now.getTime())); }
    }
    if (WEIGHTS.length === 1) { WEIGHTS = [WEIGHTS[0], WEIGHTS[0]]; WDATES = [WDATES[0] || '', WDATES[0] || '']; }
    // 3 etiquetas del eje X del mini-grafico (primera / media / última fecha real)
    var chartLabels = WDATES.length
      ? [WDATES[0], WDATES[Math.floor((WDATES.length - 1) / 2)], WDATES[WDATES.length - 1]]
      : ['', '', ''];

    // ---------- MERGE de los CHECK-INS del cliente (lo que apunta él en la app) ----------
    if (Object.keys(chkByKey).length) {
      var dtOf = function (fecha) { return new Date(fecha + 'T00:00:00'); };
      fields.forEach(function (f) {
        var arr = chkByKey[f.k]; if (!arr || !arr.length) return;
        var last = arr[arr.length - 1], prev = arr.length >= 2 ? arr[arr.length - 2] : null;
        f.v = comma(last.val);
        if (prev) f.p = comma(prev.val);
        arr.slice().reverse().forEach(function (pt) {
          var raw = parseFloat(String(pt.val).replace(',', '.')); if (isNaN(raw)) return;
          f.hist.unshift({ v: comma(pt.val), raw: raw, weekLabel: 'Semana ' + isoWeek(dtOf(pt.fecha)), range: weekRange(dtOf(pt.fecha)) });
        });
        f.hist = f.hist.slice(0, 12);
      });
      var wField = fields.filter(function (f) { return /peso|weight/i.test(f.l) || f.k === 'peso'; })[0];
      var wKey = wField ? wField.k : (chkByKey['peso-corporal'] ? 'peso-corporal' : (chkByKey['peso'] ? 'peso' : null));
      if (wKey && chkByKey[wKey]) {
        chkByKey[wKey].forEach(function (pt) { var n = parseFloat(String(pt.val).replace(',', '.')); if (!isNaN(n) && n > 0) { WEIGHTS.push(n); WDATES.push(fmtShort(dtOf(pt.fecha).getTime())); } });
        if (WEIGHTS.length === 1) { WEIGHTS = [WEIGHTS[0], WEIGHTS[0]]; WDATES = [WDATES[0] || '', WDATES[0] || '']; }
        chartLabels = WDATES.length ? [WDATES[0], WDATES[Math.floor((WDATES.length - 1) / 2)], WDATES[WDATES.length - 1]] : ['', '', ''];
      }
    }

    // ---------- PHOTOSETS (fotos de progreso) ----------
    var SHOTS = ['Frontal', 'Lateral', 'Espalda'];
    // FUSIÓN de las dos fuentes: (1) fotos que el cliente sube en sus check-ins y (2) fotos históricas de Harbiz.
    // Cada semana muestra sus 3 fotos; antes, si había 1 check-in, se ocultaban TODAS las de Harbiz.
    var SLUG_LABEL = { 'peso-corporal': 'Peso corporal', 'peso': 'Peso corporal', 'peso_corporal': 'Peso corporal', 'pecho': 'Pecho', 'cadera': 'Cadera', 'cuello': 'Cuello', 'cintura': 'Cintura', 'hombros': 'Hombros', 'rollitos': 'Rollitos', 'muslo-derecho': 'Muslo derecho', 'muslo-izquierdo': 'Muslo izquierdo', 'b-ceps-derecho': 'Bíceps derecho', 'b-ceps-izquierdo': 'Bíceps izquierdo', 'gemelo-derecho': 'Gemelo derecho', 'gemelo-izquierdo': 'Gemelo izquierdo', 'antebrazo-derecho': 'Antebrazo derecho', 'antebrazo-izquierdo': 'Antebrazo izquierdo' };
    function unslug(s) { return SLUG_LABEL[s] || String(s).replace(/-/g, ' ').replace(/^./, function (c) { return c.toUpperCase(); }); }
    // Cliente NUEVO (o medidas que no venían de Harbiz): crea la métrica de "Composición y medidas" desde sus check-ins.
    (function () {
      if (!Object.keys(chkByKey).length) return;
      var _dtOf = function (fecha) { return new Date(String(fecha).slice(0, 10) + 'T00:00:00'); };
      var _have = {}; fields.forEach(function (f) { _have[f.k] = 1; });
      Object.keys(chkByKey).forEach(function (k) {
        if (_have[k] || /peso|weight|grasa|fat|body/i.test(k)) return;   // el peso va al gráfico; la grasa se excluye
        var arr = chkByKey[k]; if (!arr || !arr.length) return;
        var hist = arr.slice().reverse().map(function (pt) { var raw = parseFloat(String(pt.val).replace(',', '.')); return isNaN(raw) ? null : { v: comma(pt.val), raw: raw, weekLabel: 'Semana ' + isoWeek(_dtOf(pt.fecha)), range: weekRange(_dtOf(pt.fecha)) }; }).filter(Boolean).slice(0, 12);
        if (!hist.length) return;
        var last = arr[arr.length - 1], prev = arr.length >= 2 ? arr[arr.length - 2] : null;
        fields.push({ k: k, l: unslug(k), u: 'cm', v: comma(last.val), p: comma(prev ? prev.val : last.val), hist: hist });
      });
      MET = fields.length ? [{ g: 'Composición y medidas', f: fields }] : [];
    })();
    var dtOf2 = function (fecha) { return new Date(String(fecha).slice(0, 10) + 'T00:00:00'); };
    // Índice unificado de TODAS las medidas por fecha (métricas de Harbiz + check-ins del cliente),
    // para que CUALQUIER foto (semana con check-in o histórica) muestre TODAS las medidas de esa fecha.
    var _covered = {};
    function toMs(x) { var v = ms(x); if (v == null) return NaN; if (typeof v === 'number') return v; var n = new Date(v).getTime(); return n; }
    function esGrasa(name) { return /grasa|body\s?fat/i.test(name || ''); } // se excluye (igual que "Composición y medidas")
    function valNum(y) { return parseFloat(String(y).replace(',', '.')); }
    var _metSeries = metrics.filter(function (m) { return !esGrasa(m.name); }).map(function (m) {
      var sg = slug(m.name), esPeso = /peso|weight/i.test(m.name || ''); _covered[sg] = 1;
      var pts = (m.data || []).map(function (p) { return { t: toMs(p.t), y: p.y }; });
      var cv = metVal(m); if (cv != null && cv !== '') pts.push({ t: now.getTime(), y: cv });
      var ck = chkByKey[sg]; if (ck) ck.forEach(function (pt) { var d = dtOf2(pt.fecha); if (!isNaN(d)) pts.push({ t: d.getTime(), y: pt.val }); });
      pts = pts.filter(function (p) { var n = valNum(p.y); return p.t != null && !isNaN(p.t) && !isNaN(n) && n > 0; }).sort(function (a, b) { return a.t - b.t; }); // sin valores 0/vacíos
      return { label: m.name, esPeso: esPeso, unit: m.unit || (esPeso ? 'kg' : 'cm'), pts: pts };
    }).filter(function (s) { return s.pts.length; });
    // medidas que el cliente apunta en sus check-ins y que NO existen como métrica de Harbiz
    Object.keys(chkByKey).forEach(function (sg) {
      if (_covered[sg] || esGrasa(sg)) return;
      var esPeso = sg.indexOf('peso') >= 0;
      var pts = chkByKey[sg].map(function (pt) { var d = dtOf2(pt.fecha); return { t: d.getTime(), y: pt.val }; })
        .filter(function (p) { var n = valNum(p.y); return !isNaN(p.t) && !isNaN(n) && n > 0; }).sort(function (a, b) { return a.t - b.t; });
      if (pts.length) _metSeries.push({ label: unslug(sg), esPeso: esPeso, unit: esPeso ? 'kg' : 'cm', pts: pts });
    });
    _metSeries.sort(function (a, b) { return (b.esPeso ? 1 : 0) - (a.esPeso ? 1 : 0); }); // peso primero
    // devuelve el valor de cada medida en la fecha de la foto: mismo día exacto → el más reciente hasta esa
    // fecha (+4 días de margen) → el primero disponible. Así CUALQUIER foto muestra TODAS las medidas.
    function dayKeyOf(t) { var d = new Date(t); return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); }
    function medidasEnFecha(t) {
      var dk = dayKeyOf(t), i;
      return _metSeries.map(function (s) {
        var hit = null;
        for (i = s.pts.length - 1; i >= 0; i--) { if (dayKeyOf(s.pts[i].t) === dk) { hit = s.pts[i]; break; } }        // 1) mismo día
        if (!hit) for (i = s.pts.length - 1; i >= 0; i--) { if (s.pts[i].t <= t + 4 * 86400000) { hit = s.pts[i]; break; } } // 2) más reciente hasta esa fecha
        if (!hit) hit = s.pts[0];                                                                                          // 3) el primero disponible
        return hit ? { label: s.label, valor: comma(hit.y) + ' ' + s.unit } : null;
      }).filter(Boolean);
    }
    function pesoEnFecha(t) { var m = medidasEnFecha(t).filter(function (x) { return /kg$/.test(x.valor); })[0]; return m ? m.valor : ''; }
    var setsClient = chkList.filter(function (c) { return c.fotos && Object.keys(c.fotos).length; }).map(function (c) {
      var dt = dtOf2(c.fecha);
      var pw = (c.valores && (c.valores['peso-corporal'] || c.valores['peso'] || c.valores['peso_corporal'])) || '';
      return { key: (c.fecha || '').slice(0, 10), t: dt.getTime(), w: 'Semana ' + isoWeek(dt), date: d2(dt.getDate()) + ' ' + MO[dt.getMonth()].slice(0, 3), kg: pw ? comma(pw) + ' kg' : pesoEnFecha(dt.getTime()), fotos: c.fotos, medidas: medidasEnFecha(dt.getTime()) };
    });
    var setsHarbiz = ((row.evolution && row.evolution.photos) || []).filter(function (p) { return p.front_url || p.side_url || p.back_url; }).map(function (p) {
      var dt = new Date(ms(p.date));
      return { key: dt.getFullYear() + '-' + d2(dt.getMonth() + 1) + '-' + d2(dt.getDate()), t: dt.getTime(), w: 'Semana ' + isoWeek(dt), date: d2(dt.getDate()) + ' ' + MO[dt.getMonth()].slice(0, 3), kg: pesoEnFecha(dt.getTime()), fotos: { Frontal: p.front_url, Lateral: p.side_url, Espalda: p.back_url }, medidas: medidasEnFecha(dt.getTime()) };
    });
    // nº de semana RELATIVO al inicio del cliente (su primera foto = Semana 1), no la semana del año
    var _allSets = setsClient.concat(setsHarbiz);
    var _tMin = _allSets.length ? Math.min.apply(null, _allSets.map(function (s) { return s.t; })) : 0;
    function semRel(t) { return 'Semana ' + (Math.floor((t - _tMin) / (7 * 86400000)) + 1); }
    var seenD = {};
    var PHOTOSETS = _allSets.sort(function (a, b) { return b.t - a.t; })
      .filter(function (s) { if (seenD[s.key]) return false; seenD[s.key] = 1; return true; })
      .slice(0, 12).map(function (s) { return { w: semRel(s.t), date: s.date, kg: s.kg, fotos: s.fotos, medidas: s.medidas || [] }; });
    var SESS = PHOTOSETS.map(function (p) { return p.date; });
    // Comparativa antes/después para Hoy: primer set (más antiguo) vs último (más reciente). El render añade el open de cada foto.
    var progresoFotos = null;
    if (PHOTOSETS.length) {
      // dos columnas SIEMPRE que haya fotos: si solo hay un set, la derecha ("Últimas") se rellena con el mismo (mejor que una foto suelta gigante)
      progresoFotos = { hay: true, dos: PHOTOSETS.length >= 1,
        primeras: PHOTOSETS[PHOTOSETS.length - 1], ultimas: PHOTOSETS[0] };
    }
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
    var todayKeyReg = now.getFullYear() + '-' + d2(now.getMonth() + 1) + '-' + d2(now.getDate());
    var registro = regList.filter(function (r) { return (r.fecha || '').slice(0, 10) === todayKeyReg; }).slice(-1)[0]
      || regList.slice(-1)[0] || null;
    var logsInit = {};
    if (registro && Array.isArray(registro.ejercicios)) {
      registro.ejercicios.forEach(function (re) {
        var ex = EX.filter(function (e) { return e.n === re.nombre; })[0];
        if (ex && Array.isArray(re.series)) logsInit[ex.id] = re.series.map(function (s) { return { r: s.reps || '', w: s.peso || '', done: !!s.done }; });
      });
    }
    // ---------- EXPROG: progreso por ejercicio (a partir de TODO el histórico de registros) ----------
    function toNum(v) { var n = parseFloat(String(v == null ? '' : v).replace(',', '.').replace(/[^0-9.\-]/g, '')); return isNaN(n) ? null : n; }
    var progMap = {}; // nombre ejercicio -> [{date, top, reps, vol, sets}]
    regList.forEach(function (r) {
      var fecha = (r.fecha || '').slice(0, 10);
      if (!Array.isArray(r.ejercicios)) return;
      r.ejercicios.forEach(function (re) {
        var nombre = re.nombre || 'Ejercicio';
        var series = Array.isArray(re.series) ? re.series : [];
        var top = null, topReps = null, vol = 0, valid = 0;
        series.forEach(function (s) {
          var w = toNum(s.peso), rp = toNum(s.reps);
          if (w != null) { if (top == null || w > top) { top = w; topReps = rp; } if (rp != null) vol += w * rp; valid++; }
        });
        if (!valid) return;
        (progMap[nombre] || (progMap[nombre] = [])).push({ date: fecha, top: top, reps: topReps, vol: Math.round(vol), sets: valid });
      });
    });
    var EXPROG = Object.keys(progMap).map(function (nombre) {
      var pts = progMap[nombre].sort(function (a, b) { return a.date < b.date ? -1 : 1; });
      var first = pts[0], last = pts[pts.length - 1];
      var ex = EX.filter(function (e) { return e.n === nombre; })[0];
      var delta = (first && last && first.top != null && last.top != null) ? (last.top - first.top) : 0;
      return {
        nombre: nombre, y: ex ? ex.y : '', sessions: pts.length,
        last: last ? last.top : null, lastReps: last ? last.reps : null, lastDate: last ? last.date : '',
        delta: Math.round(delta * 10) / 10, points: pts
      };
    }).sort(function (a, b) { return (b.lastDate < a.lastDate ? -1 : 1); });

    // ---------- header (día de hoy) ----------
    var todayDay = DAYS.filter(function (d) { return d.today; })[0] || DAYS[0];
    var header = {
      nombre: [row.nombre, row.apellido].filter(Boolean).join(' ') || (row.email || ''),
      email: row.email || '',
      week: week, dayNum: now.getDate(), month: MO[now.getMonth()], monthCap: MO[now.getMonth()].charAt(0).toUpperCase() + MO[now.getMonth()].slice(1), year: now.getFullYear(), weekday: WD[now.getDay()],
      nMeals: DIET.length, nMetrics: fields.length, nPhotos: PHOTOSETS.length
    };

    // ---------- Plan de hoy (tareas) + Resumen semanal (%) ----------
    var todayItems = (byDay[todayKey] && byDay[todayKey].items) || [];
    function hasT(type) { return todayItems.some(function (x) { return x.type === type; }); }
    function doneT(type) { return todayItems.some(function (x) { return x.type === type && x.done; }); }
    var regToday = regByDate[todayKey] || {};
    var entrenoHecho = regToday.workout || doneT('workout');
    var todayTasks = [];
    var checkinDoneThisWeek = !!chkWeeks[wkKeyOf(now)];
    if (hasT('bodyStats')) todayTasks.push({ key: 'medidas', label: 'Métricas personales · medidas', sub: 'Peso y medidas', done: doneT('bodyStats') || !!chkMedDates[todayKey] });
    if (hasT('bodyPhoto')) todayTasks.push({ key: 'fotos', label: 'Métricas personales · fotos', sub: 'Frontal, lateral y espalda', done: doneT('bodyPhoto') || !!chkFotoDates[todayKey] });
    if (hasT('cardio')) { var _cItem = todayItems.filter(function (x) { return x.type === 'cardio'; })[0] || {}; todayTasks.push({ key: 'cardio', label: _cItem.title || 'Caminar', sub: cardioSubReal(_cItem, regToday.pasos), pasos: (_cItem.config && _cItem.config.pasos) || '', pasosHechos: (regToday.pasos != null ? regToday.pasos : ''), done: doneT('cardio') || !!regToday.cardio }); }
    if (hasT('workout')) todayTasks.push({ key: 'entreno', label: 'Entrenamiento', sub: (todayItems.filter(function (x) { return x.type === 'workout'; })[0] || {}).title || 'Entrenamiento', done: entrenoHecho });
    var comHoy = comByDate[todayKey] || {};   // comidas REALMENTE registradas hoy (no las opciones por defecto del plan)
    // Nutrición SOLO los días que el entrenador la haya puesto (con su título del CRM), no todos los días.
    var _nutToday = todayItems.filter(function (x) { return x.type === 'nutritionPlan' || x.type === 'nutrition'; })[0];
    if (_nutToday) todayTasks.push({ key: 'nutricion', label: _nutToday.title || 'Nutrición', sub: (DIET.length ? DIET.length + ' comidas' : 'Marca lo que has comido'), done: (DIET.length ? DIET.every(function (m) { return comHoy[m.id] != null; }) : !!_nutToday.done) });
    var trainDoneN = todayTasks.filter(function (t) { return t.done; }).length;
    var planHoyPct = todayTasks.length ? Math.round(trainDoneN / todayTasks.length * 100) : 0;
    // cumplimiento semanal (planificado vs completado en la semana actual)
    var wkEnd = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 7);
    var weekEv = events.filter(function (e) { if (e.removed) return false; var dt = new Date(ms(e.date)); return dt >= mon && dt < wkEnd; });
    function compl(types) {
      var pl = weekEv.filter(function (e) { return types.indexOf(e.type) >= 0; });
      var dn = pl.filter(function (e) {
        if (e.completed) return true;
        var dt = new Date(ms(e.date)); var k = dt.getFullYear() + '-' + d2(dt.getMonth() + 1) + '-' + d2(dt.getDate());
        var reg = regByDate[k] || {};
        if (types.indexOf('workout') >= 0 && reg.workout) return true;
        if (types.indexOf('cardio') >= 0 && reg.cardio) return true;
        return false;
      });
      return { done: dn.length, total: pl.length, pct: pl.length ? Math.round(dn.length / pl.length * 100) : 0 };
    }
    var cEntreno = compl(['workout']), cCardio = compl(['cardio']), cMetricas = compl(['bodyStats', 'bodyPhoto']);
    // nutrición semanal: días de ESTA semana con TODAS las comidas registradas ÷ 7 (cumplimiento semanal, no 100% por día)
    var nutDone = 0;
    if (DIET.length) {
      for (var _di = 0; _di < 7; _di++) {
        var _dd2 = new Date(mon); _dd2.setDate(mon.getDate() + _di);
        var _dk = _dd2.getFullYear() + '-' + d2(_dd2.getMonth() + 1) + '-' + d2(_dd2.getDate());
        var _com = comByDate[_dk] || {};
        if (DIET.every(function (m) { return _com[m.id] != null; })) nutDone++;
      }
    }
    var cNutricion = { done: nutDone, total: DIET.length ? 7 : 0, pct: DIET.length ? Math.round(nutDone / 7 * 100) : 0 };
    var totPl = cEntreno.total + cCardio.total + cMetricas.total + cNutricion.total, totDn = cEntreno.done + cCardio.done + cMetricas.done + cNutricion.done;
    var weekSummary = {
      entrenos: cEntreno, cardio: cCardio, metricas: cMetricas, nutricion: cNutricion,
      global: { done: totDn, total: totPl, pct: totPl ? Math.round(totDn / totPl * 100) : 0 },
      kcal: (plan && plan.valuesTarget && plan.valuesTarget.energy) ? Math.round(plan.valuesTarget.energy) : 0
    };
    // macros objetivo del plan de nutrición (para el resumen de la pantalla de inicio)
    var _vt = (plan && plan.valuesTarget) || {};
    var macros = {
      kcal: _vt.energy != null ? Math.round(_vt.energy) : 0,
      protein: _vt.protein != null ? Math.round(_vt.protein) : 0,
      carbs: _vt.carbs != null ? Math.round(_vt.carbs) : 0,
      fat: _vt.fat != null ? Math.round(_vt.fat) : 0,
      plan: (plan && plan.name) || ''
    };

    // ---------- RESUMEN MENSUAL (desglose por mes: cumplimiento + detalle) ----------
    function _mkey(dt) { return dt.getFullYear() + '-' + d2(dt.getMonth() + 1); }
    var _pasosObj = 0;
    events.forEach(function (e) { if (!_pasosObj && e.type === 'cardio' && e.config && e.config.pasos) _pasosObj = parseInt(String(e.config.pasos).replace(/[^0-9]/g, ''), 10) || 0; });
    var _monSet = {};
    function _addMon(dt) { if (dt && !isNaN(dt)) _monSet[_mkey(dt)] = 1; }
    events.forEach(function (e) { if (!e.removed) _addMon(new Date(ms(e.date))); });
    regList.forEach(function (r) { var f = (r.fecha || '').slice(0, 7); if (f) _monSet[f] = 1; });
    Object.keys(comByDate).forEach(function (k) { _monSet[k.slice(0, 7)] = 1; });
    chkList.forEach(function (c) { var f = (c.fecha || '').slice(0, 7); if (f) _monSet[f] = 1; });
    // Nota: NO se añade el mes actual "por defecto"; el Resumen del mes solo existe si hay actividad real ese mes
    // (así un cliente nuevo no ve un resumen vacío en cero — ni puede compartirlo).
    var _monKeys = Object.keys(_monSet).filter(function (k) { return /^\d{4}-\d{2}$/.test(k); }).sort().reverse().slice(0, 12);
    var resumenMeses = _monKeys.map(function (mk) {
      var yr = +mk.slice(0, 4), mo = +mk.slice(5, 7) - 1;
      var daysInMonth = new Date(yr, mo + 1, 0).getDate();
      var isCurrent = (mk === _mkey(now));
      var lastDay = isCurrent ? now.getDate() : daysInMonth;
      function dk(d) { return yr + '-' + d2(mo + 1) + '-' + d2(d); }
      function evMonth(types) {
        var pl = events.filter(function (e) { if (e.removed) return false; var dt = new Date(ms(e.date)); return !isNaN(dt) && _mkey(dt) === mk && types.indexOf(e.type) >= 0; });
        var dn = pl.filter(function (e) { if (e.completed) return true; var dt = new Date(ms(e.date)); var k = dt.getFullYear() + '-' + d2(dt.getMonth() + 1) + '-' + d2(dt.getDate()); var reg = regByDate[k] || {}; if (types.indexOf('workout') >= 0 && reg.workout) return true; if (types.indexOf('cardio') >= 0 && reg.cardio) return true; return false; });
        return { done: dn.length, total: pl.length, pct: pl.length ? Math.round(dn.length / pl.length * 100) : 0 };
      }
      var mEnt = evMonth(['workout']), mCar = evMonth(['cardio']), mMet = evMonth(['bodyStats', 'bodyPhoto']);
      // cardio día a día (planificado o hecho)
      var cardioDias = [];
      for (var dc = 1; dc <= lastDay; dc++) {
        var kc = dk(dc), regc = regByDate[kc] || {};
        var plannedC = events.some(function (e) { if (e.type !== 'cardio' || e.removed) return false; var ed = new Date(ms(e.date)); return ed.getFullYear() === yr && ed.getMonth() === mo && ed.getDate() === dc; });
        var doneC = !!regc.cardio || events.some(function (e) { if (e.type !== 'cardio' || !e.completed) return false; var ed = new Date(ms(e.date)); return ed.getFullYear() === yr && ed.getMonth() === mo && ed.getDate() === dc; });
        if (plannedC || doneC) cardioDias.push({ lbl: d2(dc) + ' ' + MO[mo].slice(0, 3), done: doneC, pasos: doneC ? (_pasosObj || 0) : 0 });
      }
      var _cardioSum = cardioDias.reduce(function (s, d) { return s + (d.pasos || 0); }, 0);
      var cardioMedia = cardioDias.length ? Math.round(_cardioSum / cardioDias.length) : 0;
      // nutrición: días con TODAS las comidas registradas + recuento por opción (agrupado por comida) + kcal por día
      var nutDoneDias = 0, nutTotalDias = 0, nutDias = [], _cont = {};
      function kcalDe(m, op, kn2) {
        if (op === 'libre') return ((comLibreByDate[kn2] || {})[m.n]) || 0;
        if (op === 'mp') return (m.okcal && m.okcal[0]) || 0;
        return (m.okcal && m.okcal[op]) || 0;
      }
      if (DIET.length) {
        DIET.forEach(function (m) { _cont[m.id] = {}; });
        for (var dn2 = 1; dn2 <= lastDay; dn2++) {
          var kn = dk(dn2), com = comByDate[kn] || {}, nreg = Object.keys(com).length;
          if (!nreg) continue;
          nutTotalDias++;
          if (DIET.every(function (m) { return com[m.id] != null; })) nutDoneDias++;
          var items = [], dayKcal = 0;
          DIET.forEach(function (m) {
            var op = com[m.id]; if (op == null) return;
            var opLbl = op === 'mp' ? 'Meal prep' : op === 'libre' ? 'Cheat meal' : ('Opción ' + (op + 1));
            var kc = kcalDe(m, op, kn); dayKcal += kc;
            items.push({ meal: m.n, opcion: opLbl, kcal: kc });
            _cont[m.id][opLbl] = (_cont[m.id][opLbl] || 0) + 1;
          });
          nutDias.push({ lbl: d2(dn2) + ' ' + MO[mo].slice(0, 3), kcal: dayKcal, items: items });
        }
      }
      nutDias.reverse();
      // recuento agrupado por comida en el orden del plan (Desayuno, Comida, Cena…)
      var conteoGrupos = DIET.map(function (m) {
        var ops = Object.keys(_cont[m.id] || {}).map(function (lbl) { return { lbl: lbl, veces: _cont[m.id][lbl] }; }).sort(function (a, b) { return b.veces - a.veces; });
        return { meal: m.n, opciones: ops };
      }).filter(function (g) { return g.opciones.length; });
      var nutPct = nutTotalDias ? Math.round(nutDoneDias / nutTotalDias * 100) : 0;
      // ejercicios: progresión de peso dentro del mes
      var ejercicios = Object.keys(progMap).map(function (nombre) {
        var pts = progMap[nombre].filter(function (p) { return (p.date || '').slice(0, 7) === mk && p.top != null; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
        if (!pts.length) return null;
        var ini = pts[0].top, fin = pts[pts.length - 1].top, delta = Math.round((fin - ini) * 10) / 10;
        return { nombre: nombre, ini: comma(ini), fin: comma(fin), delta: delta, subio: delta > 0, sesiones: pts.length };
      }).filter(Boolean).sort(function (a, b) { return b.delta - a.delta; });
      // métricas / check-ins del mes
      var checkins = chkList.filter(function (c) { return (c.fecha || '').slice(0, 7) === mk; }).map(function (c) {
        var dt = new Date((c.fecha || '').slice(0, 10) + 'T00:00:00');
        var pw = (c.valores && (c.valores['peso-corporal'] || c.valores['peso'])) || '';
        return { lbl: (isNaN(dt) ? (c.fecha || '') : (dt.getDate() + ' ' + MO[dt.getMonth()].slice(0, 3))), peso: pw ? (comma(pw) + ' kg') : '', n: c.valores ? Object.keys(c.valores).length : 0 };
      }).reverse();
      // peso inicio/fin del mes
      var _firstT = new Date(yr, mo, 1).getTime(), _lastT = new Date(yr, mo, lastDay).getTime();
      var pIni = pesoEnFecha(_firstT), pFin = pesoEnFecha(_lastT);
      var _pi = parseFloat(String(pIni).replace(',', '.')), _pf2 = parseFloat(String(pFin).replace(',', '.'));
      var pDelta = (!isNaN(_pi) && !isNaN(_pf2)) ? Math.round((_pf2 - _pi) * 10) / 10 : 0;
      // fotos del mes
      var fotosN = _allSets.filter(function (s) { var dt = new Date(s.t); return dt.getFullYear() === yr && dt.getMonth() === mo; }).length;
      var gDone = mEnt.done + mCar.done + mMet.done + nutDoneDias, gTot = mEnt.total + mCar.total + mMet.total + nutTotalDias;
      return {
        key: mk, label: MO[mo].charAt(0).toUpperCase() + MO[mo].slice(1) + ' ' + yr,
        cerrado: !isCurrent,   // el mes ya terminó (se puede compartir/imprimir/guardar); el mes en curso, NO
        entrenos: mEnt, cardio: { done: mCar.done, total: mCar.total, pct: mCar.pct, objetivo: _pasosObj, media: cardioMedia, dias: cardioDias },
        nutricion: { done: nutDoneDias, total: nutTotalDias, pct: nutPct, dias: nutDias, conteoGrupos: conteoGrupos },
        metricas: { done: mMet.done, total: mMet.total, pct: mMet.pct, checkins: checkins },
        global: gTot ? Math.round(gDone / gTot * 100) : 0,
        peso: { ini: pIni || '—', fin: pFin || '—', delta: pDelta }, fotos: fotosN, ejercicios: ejercicios
      };
    });

    return {
      DIET: DIET, EX: EX, WK: WK, VAR: VAR, DAYS: DAYS, APPTS: APPTS, MET: MET, VID: VID, resumenMeses: resumenMeses,
      WEIGHTS: WEIGHTS, chartLabels: chartLabels, PHOTOSETS: PHOTOSETS, SHOTS: SHOTS, SESS: SESS, DATES: DATES,
      mealsSel: mealsSel, header: header, logsInit: logsInit,
      todayTasks: todayTasks, planHoyPct: planHoyPct, weekSummary: weekSummary, macros: macros,
      mealsByDate: comByDate, checkinDoneThisWeek: checkinDoneThisWeek, progresoFotos: progresoFotos,
      WEEKS: WEEKS, curWeekIdx: curWeekIdx, EXPROG: EXPROG
    };
  }

  root.buildAppData = buildAppData;
  if (typeof module !== 'undefined' && module.exports) module.exports = { buildAppData: buildAppData };
})(typeof window !== 'undefined' ? window : globalThis);
