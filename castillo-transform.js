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

  function buildAppData(row, programs, ejercicios, registros, comidaRegs, checkinRegs) {
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

    // ---------- REGISTROS DEL CLIENTE por fecha (lo que él marca en la app: entreno / cardio) ----------
    var regByDate = {};
    regList.forEach(function (r) {
      var k = (r.fecha || '').slice(0, 10); if (!k) return;
      var o = regByDate[k] || (regByDate[k] = { workout: false, cardio: false });
      if (r.estado === 'completado' || (Array.isArray(r.ejercicios) && r.ejercicios.length)) o.workout = true;
      if (r.cardio) o.cardio = true;
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
        if (statsItem || photoItem) acts.push({ type: 'metricas', label: 'Métricas personales', sub: 'Peso, medidas y foto', done: !!((statsItem && statsItem.done) || (photoItem && photoItem.done)) });
        if (cardio) acts.push({ type: 'cardio', label: cardio.title || 'Caminar', sub: 'Cardio', done: !!cardio.done });
        if (wkItem) acts.push({ type: 'workout', label: wkItem.title, sub: (WK[wkKey] ? WK[wkKey].length + ' ejercicios' : 'Entrenamiento'), done: !!wkItem.done, wk: wkKey });
        out.push({
          d: dt.getDate(), w: WD1[dt.getDay()], long: WD[dt.getDay()] + ' ' + dt.getDate() + ' de ' + MO[dt.getMonth()],
          rom: ROM[i], t: title, s: status, wk: wkKey, n: nCount, acts: acts,
          fecha: dt.getFullYear() + '-' + d2(dt.getMonth() + 1) + '-' + d2(dt.getDate()),
          ses: wkItem ? (hh + ' · Su domicilio') : (cardio ? cardio.title : 'Sin sesión'),
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
        DIET.push({ id: id, h: '', n: MEAL_ES[meal.type] || meal.mealDescription || ('Comida ' + (idx + 1)), o: opts });
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
    var fields = metrics.filter(function (m) { return metVal(m) != null; }).map(function (m) {
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
      var wKey = wField ? wField.k : (chkByKey['peso'] ? 'peso' : null);
      if (wKey && chkByKey[wKey]) {
        chkByKey[wKey].forEach(function (pt) { var n = parseFloat(String(pt.val).replace(',', '.')); if (!isNaN(n) && n > 0) { WEIGHTS.push(n); WDATES.push(fmtShort(dtOf(pt.fecha).getTime())); } });
        if (WEIGHTS.length === 1) { WEIGHTS = [WEIGHTS[0], WEIGHTS[0]]; WDATES = [WDATES[0] || '', WDATES[0] || '']; }
        chartLabels = WDATES.length ? [WDATES[0], WDATES[Math.floor((WDATES.length - 1) / 2)], WDATES[WDATES.length - 1]] : ['', '', ''];
      }
    }

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
    if (hasT('bodyStats') || hasT('bodyPhoto')) todayTasks.push({ key: 'metricas', label: 'Métricas personales', sub: 'Peso, medidas y foto', done: doneT('bodyStats') || doneT('bodyPhoto') });
    if (hasT('cardio')) todayTasks.push({ key: 'cardio', label: 'Cardio', sub: (todayItems.filter(function (x) { return x.type === 'cardio'; })[0] || {}).title || 'Caminar', done: doneT('cardio') || !!regToday.cardio });
    if (hasT('workout')) todayTasks.push({ key: 'entreno', label: 'Entrenamiento', sub: (todayItems.filter(function (x) { return x.type === 'workout'; })[0] || {}).title || 'Entrenamiento', done: entrenoHecho });
    var comHoy = comByDate[todayKey] || {};   // comidas REALMENTE registradas hoy (no las opciones por defecto del plan)
    todayTasks.push({ key: 'nutricion', label: 'Pauta alimenticia', sub: DIET.length + ' comidas', done: DIET.length > 0 && DIET.every(function (m) { return comHoy[m.id] != null; }) });
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

    return {
      DIET: DIET, EX: EX, WK: WK, VAR: VAR, DAYS: DAYS, APPTS: APPTS, MET: MET, VID: VID,
      WEIGHTS: WEIGHTS, chartLabels: chartLabels, PHOTOSETS: PHOTOSETS, SHOTS: SHOTS, SESS: SESS, DATES: DATES,
      mealsSel: mealsSel, header: header, logsInit: logsInit,
      todayTasks: todayTasks, planHoyPct: planHoyPct, weekSummary: weekSummary, macros: macros,
      mealsByDate: comByDate,
      WEEKS: WEEKS, curWeekIdx: curWeekIdx, EXPROG: EXPROG
    };
  }

  root.buildAppData = buildAppData;
  if (typeof module !== 'undefined' && module.exports) module.exports = { buildAppData: buildAppData };
})(typeof window !== 'undefined' ? window : globalThis);
