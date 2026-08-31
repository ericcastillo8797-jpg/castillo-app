/* castillo-transform.js — Harbiz crudo (harbiz_clientes + programs) -> formas del diseño Castillo App.
   Puro: buildAppData(row, program) -> { DIET, EX, WK, VAR, DAYS, APPTS, MET, VID, WEIGHTS, PHOTOSETS, SESS, DATES, SHOTS, mealsSel, header }.
   Sin dependencias. Válido en navegador y en Node. */
(function (root) {
  'use strict';

  var WD = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  var WD1 = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  var WD3 = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
  var MO = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var DW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
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
  function ddmm(dt) { try { var d = (dt instanceof Date) ? dt : new Date(dt); if (isNaN(d)) return ''; return String(d.getDate()).padStart(2, '0') + '-' + String(d.getMonth() + 1).padStart(2, '0'); } catch (e) { return ''; } }
  function startOfDay(dt) { return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()); }
  function mondayOf(dt) { var d = startOfDay(dt); var g = (d.getDay() + 6) % 7; d.setDate(d.getDate() - g); return d; }
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'w'; }

  function foodUnit(f) {
    var n = (f.name || '').toLowerCase();
    if (/milk|leche|water|agua|juice|zumo|yogur|yogurt|drink|bebida|batido|shake/.test(n)) return ' ml';
    return ' g';
  }

  function buildAppData(row, programs, ejercicios, registros, comidaRegs, checkinRegs, comidaLibre, customMetrics) {
    // métricas personalizadas del cliente: key -> {label, unit} (para etiquetar bien en la Evolución)
    var customByKey = {}; (Array.isArray(customMetrics) ? customMetrics : []).forEach(function (m) { if (m && m.key) customByKey[m.key] = { label: m.label || m.key, unit: m.unit || '' }; });
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
    // La capa de datos también escribe texto que ve el cliente, así que necesita saber el idioma.
    var _EN = (function () { try { return localStorage.getItem('castillo_lang') === 'en'; } catch (e) { return false; } })();
    var TXT = { pasos: _EN ? 'steps' : 'pasos', faltan: _EN ? 'to go' : 'faltan', cumplido: _EN ? 'goal reached' : 'objetivo cumplido', de: _EN ? 'of' : 'de', series: _EN ? 'sets' : 'series', ejercicios: _EN ? 'exercises' : 'ejercicios' };
    function cardioSub(item) { var p = item && item.config && item.config.pasos; return p ? (miles(p) + ' ' + TXT.pasos) : 'Cardio'; }
    // Un día de cardio se da por cumplido si lo marcó el cliente O si los pasos reales que trae
    // Apple Salud llegan al objetivo que Alex le puso a ESE cliente (no a un 10.000 fijo para todos).
    function cardioCumplido(marcado, pasosHechos, objetivo) {
      if (marcado) return true;
      var obj = parseInt(String(objetivo == null ? '' : objetivo).replace(/[^0-9]/g, ''), 10) || 0;
      var hechos = parseInt(String(pasosHechos == null ? '' : pasosHechos).replace(/[^0-9]/g, ''), 10) || 0;
      return obj > 0 && hechos >= obj;
    }
    // sub del cardio mostrando los pasos REALES de Apple Salud hacia el objetivo (ej. "5.547 / 12.000 pasos")
    // El cliente ve el tipo de tarea en grande y, pequeñito al lado, el nombre que le puso Alex.
    function notaDe(base, titulo) {
      var t = String(titulo || '').trim();
      if (!t || t.toLowerCase() === base.toLowerCase()) return '';
      // El nombre que viene del CRM solo se enseña si aporta algo. El cardio llega como "Walking"
      // y poner "Caminar (Walking)" no dice nada nuevo: al cliente español no le sirve el inglés,
      // y al inglés "Walk (Walking)" tampoco. En cambio "Nutrición (P.S Alimentación M.1)" sí vale.
      var GENERICOS = ['walking', 'walk', 'steps', 'caminar', 'andar', 'pasos', 'cardio',
                       'workout', 'training', 'entrenamiento', 'entreno',
                       'nutrition', 'nutricion', 'nutrición', 'diet', 'dieta', 'meal plan'];
      if (GENERICOS.indexOf(t.toLowerCase()) >= 0) return '';
      return t;
    }
    // Objetivo de pasos de una tarea de cardio: del campo del CRM o del texto de Harbiz ("10k steps/day")
    function objPasosDe(item) {
      var c = item && item.config && item.config.pasos;
      if (c) return parseInt(String(c).replace(/[^0-9]/g, ''), 10) || 0;
      var t = String((item && item.cardioText) || '').toLowerCase();
      var m = t.match(/([\d.,]+)\s*k\b/) || t.match(/([\d.,]+)/);
      if (!m) return 0;
      // OJO con el punto y la coma. "7.500 pasos" en espanol son SIETE MIL QUINIENTOS, no 7,5:
      // si se lee como decimal el cliente se queda con un objetivo de 8 pasos y le sale el
      // cardio hecho nada mas abrir la app. Un punto o una coma seguidos de exactamente tres
      // cifras (una o mas veces) son separador de miles, no decimal.
      var crudo = String(m[1]);
      var n = /^\d{1,3}([.,]\d{3})+$/.test(crudo)
        ? parseInt(crudo.replace(/[.,]/g, ''), 10)
        : parseFloat(crudo.replace(',', '.'));
      if (/k\b/.test(t) && n < 1000) n *= 1000;
      return Math.round(n) || 0;
    }
    // Lo que lleva HOY frente a su objetivo, para que vea cuánto le falta: "3.253 / 10.000 pasos · faltan 6.747"
    // Cuanto lleva hecho de un entreno. El TOTAL sale del plan (las series que tocaban), no de
    // lo que el cliente llego a apuntar. Los ejercicios se emparejan POR POSICION, que es como se
    // guardan, para que siga cuadrando aunque el cliente haya cambiado un ejercicio por otro.
    function progresoEntreno(reg, wkKey) {
      var lista = WK[wkKey] || [];
      if (!lista.length) return null;
      var guardados = (reg && reg.ejercicios) || [];
      var hechas = 0, totales = 0, ejHechos = 0;
      lista.forEach(function (linea, i) {
        var nombre = String(linea).split('|')[0];
        var rec = exByName[nombre];
        var plan = rec ? (parseInt(rec.s, 10) || 0) : 0;
        totales += plan;
        var ser = (guardados[i] && guardados[i].series) || [];
        var h = 0;
        ser.forEach(function (x) { if (x && (x.done || (String(x.reps || '').trim() && String(x.peso || '').trim()))) h++; });
        if (plan > 0 && h > plan) h = plan;
        hechas += h;
        if (plan > 0 && h >= plan) ejHechos++;
      });
      if (!totales) return null;
      return { hechas: hechas, totales: totales, ejHechos: ejHechos, ejTotales: lista.length,
               pct: Math.round(hechas / totales * 100) };
    }
    function cardioSubReal(item, hechos) {
      var p = objPasosDe(item);
      var h = (hechos == null || hechos === '') ? null : (parseInt(String(hechos).replace(/[^0-9]/g, ''), 10) || 0);
      if (h != null && p) {
        var falta = p - h;
        return miles(h) + ' / ' + miles(p) + ' ' + TXT.pasos + (falta > 0 ? (' · ' + TXT.faltan + ' ' + miles(falta)) : (' · ' + TXT.cumplido));
      }
      if (h != null) return miles(h) + ' ' + TXT.pasos;
      return p ? (miles(p) + ' ' + TXT.pasos) : 'Cardio';
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
    var ytPorNombre = {};    // nombre de ejercicio -> id de vídeo (de TODOS los programas)
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
              // índice de vídeos por NOMBRE de ejercicio, sin depender del título del entreno
              t.workout.exercises.forEach(function (ex) {
                var _n = String(ex.name_provisional || ex.name || '').toLowerCase().trim();
                var _y = ytId(ex.url_provisional || ex.thumbnailUrl || '');
                if (_n && _y && !ytPorNombre[_n]) ytPorNombre[_n] = _y;
              });
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
      // OJO: si esto llega como texto ("3"), las sumas del contador se concatenan en vez de sumar
      // y el "X de Y series" y el porcentaje del entreno salen mal. Se fuerza a número.
      var sets = parseInt(ex.sets, 10) || (ex.series && ex.series.length) || 3;
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
      slot.items.push({ type: e.type, title: e.title, done: !!e.completed, dt: dt, config: e.config, cardioText: e.cardioText });
    });

    // ---------- REGISTROS DEL CLIENTE por fecha (lo que él marca en la app: entreno / cardio) ----------
    var regByDate = {};
    regList.forEach(function (r) {
      var k = (r.fecha || '').slice(0, 10); if (!k) return;
      var o = regByDate[k] || (regByDate[k] = { workout: false, cardio: false, pasos: null });
      // Un entreno a medias NO cierra el dia. Antes bastaba con que hubiera CUALQUIER ejercicio
      // guardado para darlo por hecho: el cliente apuntaba 4 series de 21 y le salia "completado".
      if (r.estado === 'completado') o.workout = true;
      // El registro se guarda TAL CUAL. El progreso NO se puede calcular aqui: lo guardado solo
      // tiene las series que el cliente llego a tocar, y por eso salia "4 de 4" en un entreno de
      // 21. El total tiene que salir del PLAN, y el plan se sabe mas abajo, con el entreno del dia.
      if (Array.isArray(r.ejercicios) && r.ejercicios.length) o.wReg = r;
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
        // Cuenta REAL de ejercicios del dia. Antes solo decia "7 de 7" si estaba completado y
        // un guion en cualquier otro caso: un entreno a medias no se veia por ningun lado.
        var _wpD = (regDay.wReg && wkItem) ? progresoEntreno(regDay.wReg, wkKey) : null;
        var _nTot = (wkItem && WK[wkKey]) ? WK[wkKey].length : 0;
        var nCount = '—';
        if (wkItem && _nTot) {
          if (wkItem.done) nCount = _nTot + ' ' + TXT.de + ' ' + _nTot;
          else if (_wpD) nCount = (_wpD.ejHechos || 0) + ' ' + TXT.de + ' ' + (_wpD.ejTotales || _nTot);
        }
        var hh = wkItem ? d2(wkItem.dt.getHours()) + ':' + d2(wkItem.dt.getMinutes()) : '';
        // lista de actividades del día (como Harbiz > Planificación): métricas (foto incluida) / cardio / entreno
        var acts = [];
        if (statsItem) acts.push({ type: 'medidas', label: 'Métricas personales · medidas', sub: 'Peso y medidas', done: !!((statsItem && statsItem.done) || chkMedDates[key]) });
        // La foto de progreso va SIEMPRE con las métricas: si hay tarea de métricas (aunque el evento sea solo bodyStats
        // "Registrar evolución"), también sale la de fotos, para que el cliente pueda subirlas (igual que en el CRM).
        if (photoItem || statsItem) acts.push({ type: 'fotos', label: 'Métricas personales · fotos', sub: 'Frontal, lateral y espalda', done: !!((photoItem && photoItem.done) || chkFotoDates[key]) });
        if (cardio) acts.push({ type: 'cardio', label: 'Caminar', nota: notaDe('Caminar', cardio.title), sub: cardioSubReal(cardio, regDay.pasos), pasos: objPasosDe(cardio) || '', pasosHechos: (regDay.pasos != null ? regDay.pasos : ''), done: cardioCumplido(!!cardio.done || !!regDay.cardio, regDay.pasos, objPasosDe(cardio)) });
        if (wkItem) acts.push({ type: 'workout', label: 'Entrenamiento', nota: notaDe('Entrenamiento', wkItem.title),
          sub: (!wkItem.done && _wpD) ? (miles(_wpD.hechas) + ' ' + TXT.de + ' ' + miles(_wpD.totales) + ' ' + TXT.series)
                                      : (WK[wkKey] ? WK[wkKey].length + ' ' + TXT.ejercicios : 'Entrenamiento'),
          prog: (!wkItem.done && _wpD) ? _wpD : null, done: !!wkItem.done, wk: wkKey });
        // Nutrición del programa (con el título TAL CUAL lo puso el entrenador en el CRM, ej. "P.S Alimentación aumento músculo M.1")
        if (nutriItem) acts.push({ type: 'nutricion', label: 'Nutrición', nota: notaDe('Nutrición', nutriItem.title), sub: 'Marca lo que has comido', done: !!nutriItem.done });
        out.push({
          d: dt.getDate(), w: WD1[dt.getDay()], long: WD[dt.getDay()] + ' ' + dt.getDate() + ' de ' + MO[dt.getMonth()],
          rom: ROM[i], t: title, s: status, wk: wkKey, n: nCount, acts: acts,
          wPct: (wkItem && !wkItem.done && _wpD) ? _wpD.pct : (wkItem && wkItem.done ? 100 : 0),
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
      pts.forEach(function (p) { var dt = new Date(p.t); var wk = isoWeek(dt); if (seen[wk]) return; seen[wk] = 1; hist.push({ v: comma(p.y), raw: parseFloat(String(p.y).replace(',', '.')), weekLabel: 'Semana ' + wk, range: weekRange(dt), dia: ddmm(dt) }); });
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
          f.hist.unshift({ v: comma(pt.val), raw: raw, weekLabel: 'Semana ' + isoWeek(dtOf(pt.fecha)), range: weekRange(dtOf(pt.fecha)), dia: ddmm(dtOf(pt.fecha)) });
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
        var hist = arr.slice().reverse().map(function (pt) { var raw = parseFloat(String(pt.val).replace(',', '.')); return isNaN(raw) ? null : { v: comma(pt.val), raw: raw, weekLabel: 'Semana ' + isoWeek(_dtOf(pt.fecha)), range: weekRange(_dtOf(pt.fecha)), dia: ddmm(_dtOf(pt.fecha)) }; }).filter(Boolean).slice(0, 12);
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
      var _cm = customByKey[sg];
      if (pts.length) _metSeries.push({ label: _cm ? _cm.label : unslug(sg), esPeso: esPeso, unit: _cm ? (_cm.unit || '') : (esPeso ? 'kg' : 'cm'), pts: pts });
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
    // logsByDate: lo registrado en CADA día (no solo hoy) → al abrir un entreno pasado se ven sus reps/pesos.
    // lastByEx: último registro ANTERIOR de cada ejercicio (para "peso de la sesión anterior" real).
    // check-ins por fecha (para prerellenar el formulario de CUALQUIER día, no solo hoy)
    var checkinByDate = {};
    chkList.forEach(function (c) { var f = (c.fecha || '').slice(0, 10); if (f) checkinByDate[f] = { valores: c.valores || {}, fotos: c.fotos || {} }; });
    var logsByDate = {}, doneByDate = {}, lastByEx = {};
    regList.slice().sort(function (a, b) { return (a.fecha || '') < (b.fecha || '') ? -1 : 1; }).forEach(function (r) {
      var f = (r.fecha || '').slice(0, 10); if (!f || !Array.isArray(r.ejercicios)) return;
      var slot = logsByDate[f] || (logsByDate[f] = {});
      doneByDate[f] = (r.estado === 'completado');
      r.ejercicios.forEach(function (re) {
        var ex = EX.filter(function (e) { return e.n === re.nombre; })[0];
        if (!ex || !Array.isArray(re.series)) return;
        var series = re.series.map(function (s) { return { r: s.reps || '', w: s.peso || '', done: !!s.done }; });
        slot[ex.id] = series;
        if (series.some(function (s) { return String(s.r).trim() || String(s.w).trim(); })) lastByEx[ex.id] = { fecha: f, series: series };
      });
    });
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
    // Objetivo de pasos ASIGNADO A ESTE CLIENTE (lo pone Alex en la tarea de cardio del CRM).
    // Antes se usaba 10.000 fijo para todos, que no es lo que tiene asignado cada uno.
    var pasosObjetivo = 0;
    Object.keys(byDay).forEach(function (k) {
      (byDay[k].items || []).forEach(function (it) {
        if (!pasosObjetivo && it.type === 'cardio') pasosObjetivo = objPasosDe(it) || 0;
      });
    });
    var todayTasks = [];
    var checkinDoneThisWeek = !!chkWeeks[wkKeyOf(now)];
    if (hasT('bodyStats')) todayTasks.push({ key: 'medidas', label: 'Métricas personales · medidas', sub: 'Peso y medidas', done: doneT('bodyStats') || !!chkMedDates[todayKey] });
    if (hasT('bodyPhoto')) todayTasks.push({ key: 'fotos', label: 'Métricas personales · fotos', sub: 'Frontal, lateral y espalda', done: doneT('bodyPhoto') || !!chkFotoDates[todayKey] });
    if (hasT('cardio')) { var _cItem = todayItems.filter(function (x) { return x.type === 'cardio'; })[0] || {}; todayTasks.push({ key: 'cardio', label: 'Caminar', nota: notaDe('Caminar', _cItem.title), sub: cardioSubReal(_cItem, regToday.pasos), pasos: objPasosDe(_cItem) || '', pasosHechos: (regToday.pasos != null ? regToday.pasos : ''), done: cardioCumplido(doneT('cardio') || !!regToday.cardio, regToday.pasos, objPasosDe(_cItem) || pasosObjetivo) }); }
    if (hasT('workout')) {
      // Si lo dejo a medias, la ficha lo dice: "4 de 21 series" en vez de un texto generico, y
      // la app pinta el circulo con la parte que lleva en vez del tic de completado.
      var _wTit = (todayItems.filter(function (x) { return x.type === 'workout'; })[0] || {}).title;
      var _wp = (regToday.wReg && _wTit) ? progresoEntreno(regToday.wReg, slug(_wTit)) : null;
      todayTasks.push({ key: 'entreno', label: 'Entrenamiento',
        nota: notaDe('Entrenamiento', (todayItems.filter(function (x) { return x.type === 'workout'; })[0] || {}).title),
        sub: (_wp && !entrenoHecho) ? (miles(_wp.hechas) + ' ' + TXT.de + ' ' + miles(_wp.totales) + ' ' + TXT.series) : 'Marca tus series y pesos',
        prog: _wp || null, done: entrenoHecho });
    }
    var comHoy = comByDate[todayKey] || {};   // comidas REALMENTE registradas hoy (no las opciones por defecto del plan)
    // Nutrición SOLO los días que el entrenador la haya puesto (con su título del CRM), no todos los días.
    var _nutToday = todayItems.filter(function (x) { return x.type === 'nutritionPlan' || x.type === 'nutrition'; })[0];
    if (_nutToday) todayTasks.push({ key: 'nutricion', label: 'Nutrición', nota: notaDe('Nutrición', _nutToday.title), sub: (DIET.length ? DIET.length + ' comidas' : 'Marca lo que has comido'), done: (DIET.length ? DIET.every(function (m) { return comHoy[m.id] != null; }) : !!_nutToday.done) });
    var trainDoneN = todayTasks.filter(function (t) { return t.done; }).length;
    var planHoyPct = todayTasks.length ? Math.round(trainDoneN / todayTasks.length * 100) : 0;
    // cumplimiento semanal (planificado vs completado en la semana actual)
    var wkEnd = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 7);
    var weekEv = events.filter(function (e) { if (e.removed) return false; var dt = new Date(ms(e.date)); return dt >= mon && dt < wkEnd; });
    // CUMPLIMIENTO SEMANAL = las MISMAS tareas que ve el cliente en su agenda de esta semana.
    // Cuenta como hecho lo que registre el cliente CUALQUIER día de la semana (aunque rellene el viernes
    // las tareas del lunes) y también lo que marque el entrenador. Antes las métricas solo contaban si las
    // marcaba el entrenador, por eso salía 0 aunque el cliente las hubiera registrado.
    var _wkDays = buildWeek(new Date(mon.getTime())).days || [];
    function complTareas(tipos) {
      var tot = 0, dn = 0;
      _wkDays.forEach(function (d) {
        (d.acts || []).forEach(function (a) {
          if (tipos.indexOf(a.type) < 0) return;
          tot++;
          var hecho = !!a.done;
          if (a.type === 'nutricion' && DIET.length) {   // nutrición: hecha si están TODAS las comidas de ese día
            var _c = comByDate[d.fecha] || {};
            hecho = DIET.every(function (m) { return _c[m.id] != null; });
          }
          if (hecho) dn++;
        });
      });
      return { done: dn, total: tot, pct: tot ? Math.round(dn / tot * 100) : 0 };
    }
    var cEntreno = complTareas(['workout']), cCardio = complTareas(['cardio']);
    var cMetricas = complTareas(['medidas', 'fotos']), cNutricion = complTareas(['nutricion']);

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
    events.forEach(function (e) {
      if (_pasosObj || e.type !== 'cardio') return;
      if (e.config && e.config.pasos) { _pasosObj = parseInt(String(e.config.pasos).replace(/[^0-9]/g, ''), 10) || 0; return; }
      // los planes importados de Harbiz traen el objetivo como texto ("10k steps/day")
      var t = String(e.cardioText || '').toLowerCase();
      var m = t.match(/([\d.,]+)\s*k\b/) || t.match(/([\d.,]+)/);
      if (m) { var n = parseFloat(m[1].replace(',', '.')); if (/k\b/.test(t) && n < 1000) n *= 1000; _pasosObj = Math.round(n) || 0; }
    });
    var _monSet = {};
    function _addMon(dt) { if (dt && !isNaN(dt)) _monSet[_mkey(dt)] = 1; }
    events.forEach(function (e) { if (!e.removed) _addMon(new Date(ms(e.date))); });
    regList.forEach(function (r) { var f = (r.fecha || '').slice(0, 7); if (f) _monSet[f] = 1; });
    Object.keys(comByDate).forEach(function (k) { _monSet[k.slice(0, 7)] = 1; });
    chkList.forEach(function (c) { var f = (c.fecha || '').slice(0, 7); if (f) _monSet[f] = 1; });
    // Nota: NO se añade el mes actual "por defecto"; el Resumen del mes solo existe si hay actividad real ese mes
    // (así un cliente nuevo no ve un resumen vacío en cero — ni puede compartirlo).
    // Meses del resumen: una lista CONTINUA desde el mes más antiguo con algo hasta el actual.
    // Antes solo salían los meses con datos y se cortaba a 12, así que el cliente no podía ir
    // hacia atrás. Ahora puede llegar a cualquier mes suyo, aunque salga todo a cero.
    var _monKeys = (function () {
      var ks = Object.keys(_monSet).filter(function (k) { return /^\d{4}-\d{2}$/.test(k); }).sort();
      var hoyK = _mkey(now);
      var desde = ks.length ? ks[0] : hoyK;
      // como mínimo, dos años hacia atrás: así nunca se queda bloqueado nada más entrar
      var minK = (now.getFullYear() - 2) + '-' + d2(now.getMonth() + 1);
      if (minK < desde) desde = minK;
      var out = [], y = +desde.slice(0, 4), mo = +desde.slice(5, 7) - 1, guard = 0;
      while (guard++ < 400) {
        var k = y + '-' + d2(mo + 1);
        out.push(k);
        if (k === hoyK) break;
        mo++; if (mo > 11) { mo = 0; y++; }
      }
      return out.reverse();
    })();
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
      // Sesiones del mes día a día (día + nombre del entreno + si se hizo) → página "Entrenamientos" del PDF
      mEnt.sesiones = events.filter(function (e) {
        if (e.removed || e.type !== 'workout') return false;
        var dt = new Date(ms(e.date)); return !isNaN(dt) && _mkey(dt) === mk;
      }).map(function (e) {
        var dt = new Date(ms(e.date));
        var k = dt.getFullYear() + '-' + d2(dt.getMonth() + 1) + '-' + d2(dt.getDate());
        var reg = regByDate[k] || {};
        // se guarda la fecha real para poder ordenar: antes el sort no hacía nada y las sesiones
        // salían en el orden en que venían (24 ago antes que 2 jul).
        return { t: dt.getTime(), lbl: DW[dt.getDay()] + ' ' + dt.getDate() + ' ' + MO[dt.getMonth()].slice(0, 3), titulo: e.title || 'Entrenamiento', done: !!(e.completed || reg.workout) };
      }).sort(function (a, b) { return a.t - b.t; });
      // cardio día a día (planificado o hecho)
      var cardioDias = [];
      for (var dc = 1; dc <= daysInMonth; dc++) {   // cardio día a día: mes completo
        var kc = dk(dc), regc = regByDate[kc] || {};
        var plannedC = events.some(function (e) { if (e.type !== 'cardio' || e.removed) return false; var ed = new Date(ms(e.date)); return ed.getFullYear() === yr && ed.getMonth() === mo && ed.getDate() === dc; });
        var doneC = !!regc.cardio || events.some(function (e) { if (e.type !== 'cardio' || !e.completed) return false; var ed = new Date(ms(e.date)); return ed.getFullYear() === yr && ed.getMonth() === mo && ed.getDate() === dc; });
        // pasos REALES del día (Apple Salud). Si no hay pero está marcado a mano, se cuenta el objetivo (regla de Alex).
        var _pasosReal = (regc && regc.pasos != null && regc.pasos !== '') ? (parseInt(String(regc.pasos).replace(/[^0-9]/g, ''), 10) || 0) : null;
        // Regla de Alex: manda lo que diga Apple Salud. Si no hay lectura pero el cliente lo marcó
        // a mano, se pone el objetivo redondo. Si no hay ni lectura ni marca, NO se inventa un 0:
        // se deja sin dato (antes salía "0 pasos" en días que simplemente no se midieron).
        if (plannedC || doneC) cardioDias.push({ lbl: d2(dc) + ' ' + MO[mo].slice(0, 3), done: doneC,
          real: _pasosReal != null,
          pasos: (_pasosReal != null ? _pasosReal : (doneC ? (_pasosObj || 0) : null)) });
      }
      var _cardioSum = cardioDias.reduce(function (s, d) { return s + (d.pasos || 0); }, 0);
      // la media solo cuenta los días que tienen dato, no los días sin medir
      var _conDato = cardioDias.filter(function (d) { return d.pasos != null; }).length;
      var cardioMedia = _conDato ? Math.round(_cardioSum / _conDato) : 0;
      var cardioTotal = _cardioSum;   // pasos TOTALES del mes
      // nutrición MENSUAL por COMIDAS: comidas marcadas ÷ comidas planificadas del mes (no por días). Ej: 3 comidas/día × días con dieta.
      var nutDias = [], _cont = {};
      function kcalDe(m, op, kn2) {
        if (op === 'libre') return ((comLibreByDate[kn2] || {})[m.n]) || 0;
        if (op === 'mp') return (m.okcal && m.okcal[0]) || 0;
        return (m.okcal && m.okcal[op]) || 0;
      }
      // días del mes en los que la dieta está planificada (evento nutritionPlan). Si el plan no usa eventos por día pero hay dieta, se cuenta cada día.
      var _nutDaySet = {}, _hasNutEv = false;
      events.forEach(function (e) { if (e.removed) return; if (e.type !== 'nutritionPlan' && e.type !== 'nutrition') return; var ed = new Date(ms(e.date)); if (!isNaN(ed) && _mkey(ed) === mk) { _nutDaySet[ed.getDate()] = 1; _hasNutEv = true; } });
      var nutDoneMeals = 0, nutPlanMeals = 0;
      var _mesConComidas = Object.keys(comByDate).some(function (k) { return k.slice(0, 7) === mk; });
      var _mesCuenta = _hasNutEv || _mesConComidas;   // meses vacíos del pasado: fuera del cálculo
      if (DIET.length && _mesCuenta) {
        DIET.forEach(function (m) { _cont[m.id] = {}; });
        for (var dn2 = 1; dn2 <= daysInMonth; dn2++) {   // TODO el mes (igual que entrenos/cardio), no solo hasta hoy
          var kn = dk(dn2), com = comByDate[kn] || {};
          var plannedNut = _hasNutEv ? !!_nutDaySet[dn2] : true;   // ese día toca dieta
          if (plannedNut) { nutPlanMeals += DIET.length; DIET.forEach(function (m) { if (com[m.id] != null) nutDoneMeals++; }); }
          var nreg = Object.keys(com).length;
          if (!nreg) continue;
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
      // "Opción 2" a secas no dice nada: se guardan también los alimentos de esa opción para que
      // en el informe se lea qué comió sin tener que entrar en la app a mirarlo.
      function alimentosDeOpcion(m, lbl) {
        var mm = /^Opción (\d+)$/.exec(lbl);
        if (!mm) return [];
        var str = (m.o || [])[(+mm[1]) - 1] || '';
        return String(str).split(';').map(function (t) { return (t.split(':')[0] || '').trim(); }).filter(Boolean);
      }
      var conteoGrupos = DIET.map(function (m) {
        var ops = Object.keys(_cont[m.id] || {}).map(function (lbl) {
          return { lbl: lbl, veces: _cont[m.id][lbl], alimentos: alimentosDeOpcion(m, lbl) };
        }).sort(function (a, b) { return b.veces - a.veces; });
        return { meal: m.n, opciones: ops };
      }).filter(function (g) { return g.opciones.length; });
      var nutPct = nutPlanMeals ? Math.round(nutDoneMeals / nutPlanMeals * 100) : 0;
      // ejercicios: progresión de peso dentro del mes
      // Semanas del mes (bloques de 7 días desde el día 1): para cada ejercicio se guarda el PESO
      // MÁXIMO levantado en cada semana. Alex lo quiere así: no la media, el tope de la semana.
      var _nSem = Math.ceil(daysInMonth / 7);
      var ejercicios = Object.keys(progMap).map(function (nombre) {
        var pts = progMap[nombre].filter(function (p) { return (p.date || '').slice(0, 7) === mk && p.top != null; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
        if (!pts.length) return null;
        var sem = [];
        for (var w = 0; w < _nSem; w++) sem.push(null);
        pts.forEach(function (p) {
          var dia = parseInt(String(p.date).slice(8, 10), 10) || 1;
          var w = Math.min(_nSem - 1, Math.floor((dia - 1) / 7));
          if (sem[w] == null || p.top > sem[w]) sem[w] = p.top;
        });
        var conDato = sem.filter(function (x) { return x != null; });
        var ini = conDato[0], fin = conDato[conDato.length - 1];
        var delta = Math.round((fin - ini) * 10) / 10;
        // id del vídeo para la miniatura del informe. Se busca en el plan y, si el ejercicio no está
        // ahí (nombre distinto o venido de otro programa), en la biblioteca del CRM.
        var _nk = String(nombre || '').toLowerCase().trim();
        var _rec = exByName[nombre] || exByName[String(nombre).trim()] || null;
        var _y = (_rec && _rec.y) || '';
        if (!_y) { var _lib = libByName[_nk]; if (_lib) _y = ytId(_lib.video_url || '') || ''; }
        if (!_y) _y = ytPorNombre[_nk] || '';
        if (!_y) {   // último intento: mismo nombre ignorando acentos y signos
          var _norm = function (t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); };
          var _bus = _norm(nombre);
          Object.keys(libByName).some(function (k) { if (_norm(k) === _bus) { _y = ytId((libByName[k].video_url) || '') || ''; return !!_y; } return false; });
          if (!_y) Object.keys(exByName).some(function (k) { if (_norm(k) === _bus && exByName[k].y) { _y = exByName[k].y; return true; } return false; });
          if (!_y) Object.keys(ytPorNombre).some(function (k) { if (_norm(k) === _bus) { _y = ytPorNombre[k]; return true; } return false; });
        }
        return { nombre: nombre, y: _y, semanas: sem.map(function (x) { return x == null ? '' : comma(x); }),
                 ini: comma(ini), fin: comma(fin), delta: delta, subio: delta > 0, igual: delta === 0, sesiones: pts.length };
      }).filter(Boolean).sort(function (a, b) { return b.delta - a.delta; });
      var semanasLbl = []; for (var _w = 0; _w < _nSem; _w++) semanasLbl.push('Sem ' + (_w + 1));
      // métricas / check-ins del mes
      var checkins = chkList.filter(function (c) { return (c.fecha || '').slice(0, 7) === mk; }).map(function (c) {
        var dt = new Date((c.fecha || '').slice(0, 10) + 'T00:00:00');
        var pw = (c.valores && (c.valores['peso-corporal'] || c.valores['peso'])) || '';
        // se guarda la fecha real para poder agrupar por meses en los informes largos
        return { fecha: (c.fecha || '').slice(0, 10), lbl: (isNaN(dt) ? (c.fecha || '') : (dt.getDate() + ' ' + MO[dt.getMonth()].slice(0, 3))), peso: pw ? (comma(pw) + ' kg') : '', n: c.valores ? Object.keys(c.valores).length : 0, valores: c.valores || {} };
      }).reverse();
      // peso inicio/fin del mes
      var _firstT = new Date(yr, mo, 1).getTime(), _lastT = new Date(yr, mo, lastDay).getTime();
      var pIni = pesoEnFecha(_firstT), pFin = pesoEnFecha(_lastT);
      var _pi = parseFloat(String(pIni).replace(',', '.')), _pf2 = parseFloat(String(pFin).replace(',', '.'));
      var pDelta = (!isNaN(_pi) && !isNaN(_pf2)) ? Math.round((_pf2 - _pi) * 10) / 10 : 0;
      // fotos del mes
      var fotosN = _allSets.filter(function (s) { var dt = new Date(s.t); return dt.getFullYear() === yr && dt.getMonth() === mo; }).length;
      // cumplimiento global = MEDIA de los % de las áreas que aplican (no ponderado por volumen, para que la nutrición en comidas no lo desequilibre)
      var _gp = []; if (mEnt.total) _gp.push(mEnt.pct); if (mCar.total) _gp.push(mCar.pct); if (mMet.total) _gp.push(mMet.pct); if (nutPlanMeals) _gp.push(nutPct);
      return {
        key: mk, label: MO[mo].charAt(0).toUpperCase() + MO[mo].slice(1) + ' ' + yr,
        // rango del mes, para pedirle a WHOOP solo esos días en el informe
        desde: mk + '-01', hasta: mk + '-' + d2(new Date(yr, mo + 1, 0).getDate()),
        cerrado: !isCurrent,   // el mes ya terminó (se puede compartir/imprimir/guardar); el mes en curso, NO
        entrenos: mEnt, cardio: { done: mCar.done, total: mCar.total, pct: mCar.pct, objetivo: _pasosObj, media: cardioMedia, totalPasos: cardioTotal, dias: cardioDias },
        nutricion: { done: nutDoneMeals, total: nutPlanMeals, pct: nutPct, dias: nutDias, conteoGrupos: conteoGrupos },
        metricas: { done: mMet.done, total: mMet.total, pct: mMet.pct, checkins: checkins },
        global: _gp.length ? Math.round(_gp.reduce(function (a, b) { return a + b; }, 0) / _gp.length) : 0,
        peso: { ini: pIni || '—', fin: pFin || '—', delta: pDelta }, fotos: fotosN, ejercicios: ejercicios,
        semanasLbl: semanasLbl, kcalObjetivo: (macros && macros.kcal) || 0
      };
    });

    // ─── RESÚMENES POR TRIMESTRE, SEMESTRE Y AÑO ────────────────────────────────
    // Se agregan los meses ya calculados. Los porcentajes se recalculan SUMANDO totales, nunca
    // promediando meses: 2/4 en enero y 18/20 en febrero es 83%, no el 70% que daría la media.
    function agregaMeses(meses, label, key) {
      var suma = function (sel) {
        var d = 0, t = 0;
        meses.forEach(function (m) { var o = sel(m) || {}; d += (o.done || 0); t += (o.total || 0); });
        return { done: d, total: t, pct: t ? Math.round(d / t * 100) : 0 };
      };
      var ent = suma(function (m) { return m.entrenos; });
      var car = suma(function (m) { return m.cardio; });
      var nut = suma(function (m) { return m.nutricion; });
      var met = suma(function (m) { return m.metricas; });

      // cardio: pasos totales y media diaria REAL (sobre los días con dato)
      var pasosTot = 0, diasCar = 0, obj = 0;
      meses.forEach(function (m) {
        pasosTot += (m.cardio && m.cardio.totalPasos) || 0;
        diasCar += ((m.cardio && m.cardio.dias) || []).length;
        if (!obj) obj = (m.cardio && m.cardio.objetivo) || 0;
      });

      // detalle mes a mes en vez de día a día: un año en días serían 365 filas
      var dias = meses.map(function (m) {
        var d2 = (m.cardio && m.cardio.dias) || [];
        var media = d2.length ? Math.round(((m.cardio && m.cardio.totalPasos) || 0) / d2.length) : 0;
        return { lbl: m.label.split(' ')[0], done: (m.cardio && m.cardio.pct) >= 50, pasos: media };
      }).filter(function (x) { return x.pasos > 0; }).reverse();
      var nutDias = meses.map(function (m) {
        var nd = ((m.nutricion && m.nutricion.dias) || []).filter(function (x) { return (x.kcal || 0) > 0; });
        var kc = nd.reduce(function (a, x) { return a + (x.kcal || 0); }, 0);
        return { lbl: m.label.split(' ')[0], kcal: nd.length ? Math.round(kc / nd.length) : 0, items: [] };
      }).filter(function (x) { return x.kcal > 0; });   // meses sin comidas no salen en la tabla

      // opciones de comida: se suman las veces de todos los meses
      var gm = {};
      meses.forEach(function (m) {
        ((m.nutricion && m.nutricion.conteoGrupos) || []).forEach(function (g) {
          var d3 = gm[g.meal] || (gm[g.meal] = {});
          (g.opciones || []).forEach(function (o) {
            var e = d3[o.lbl] || (d3[o.lbl] = { veces: 0, alimentos: [] });
            e.veces += o.veces;
            if (!e.alimentos.length && (o.alimentos || []).length) e.alimentos = o.alimentos;
          });
        });
      });
      var conteoGrupos = Object.keys(gm).map(function (k) {
        return { meal: k, opciones: Object.keys(gm[k]).map(function (l) { return { lbl: l, veces: gm[k][l].veces, alimentos: gm[k][l].alimentos || [] }; }).sort(function (a, b) { return b.veces - a.veces; }) };
      });

      // ejercicios: una columna por MES del periodo (o por TRIMESTRE si el periodo es largo),
      // con el máximo levantado en cada bloque. Se recorre del más antiguo al más nuevo.
      var cron = meses.slice().reverse();
      var porBloque = cron.length > 6 ? 3 : 1;                    // más de 6 meses → columnas trimestrales
      var nCols = Math.ceil(cron.length / porBloque);
      var porEj = {};
      cron.forEach(function (m, i) {
        var idx = Math.floor(i / porBloque);
        (m.ejercicios || []).forEach(function (e) {
          var r = porEj[e.nombre] || (porEj[e.nombre] = { nombre: e.nombre, y: e.y, cols: [] });
          if (!r.y && e.y) r.y = e.y;
          var top = null;
          (e.semanas || []).forEach(function (v) { var n = parseFloat(String(v).replace(',', '.')); if (!isNaN(n) && (top == null || n > top)) top = n; });
          if (top != null && (r.cols[idx] == null || top > r.cols[idx])) r.cols[idx] = top;
        });
      });
      var ejercicios = Object.keys(porEj).map(function (k) {
        var r = porEj[k];
        var vals = [];
        for (var i = 0; i < nCols; i++) vals.push(r.cols[i] == null ? '' : comma(r.cols[i]));
        var con = r.cols.filter(function (x) { return x != null; });
        var ini2 = con[0], fin2 = con[con.length - 1];
        var delta = (con.length >= 2) ? Math.round((fin2 - ini2) * 10) / 10 : null;
        return { nombre: r.nombre, y: r.y, semanas: vals, ini: comma(ini2), fin: comma(fin2), delta: delta, subio: delta > 0, igual: delta === 0, sesiones: con.length };
      }).filter(function (e) { return e.sesiones; }).sort(function (a, b) { return (b.delta == null ? -1e9 : b.delta) - (a.delta == null ? -1e9 : a.delta); });

      var checkins = [];
      meses.forEach(function (m) { checkins = checkins.concat((m.metricas && m.metricas.checkins) || []); });

      var primeros = meses.slice().reverse();   // meses vienen del más nuevo al más viejo
      var pIni2 = (primeros[0] && primeros[0].peso && primeros[0].peso.ini) || '—';
      var pFin2 = (meses[0] && meses[0].peso && meses[0].peso.fin) || '—';
      var _a = parseFloat(String(pIni2).replace(',', '.')), _b = parseFloat(String(pFin2).replace(',', '.'));
      var pD = (!isNaN(_a) && !isNaN(_b)) ? Math.round((_b - _a) * 10) / 10 : 0;

      var gp = []; if (ent.total) gp.push(ent.pct); if (car.total) gp.push(car.pct); if (met.total) gp.push(met.pct); if (nut.total) gp.push(nut.pct);
      // rango de fechas real del periodo, para poder pedir a WHOOP solo esos días en el informe
      var _ks = meses.map(function (m) { return m.key; }).filter(Boolean).sort();
      var _d1 = _ks.length ? _ks[0] : key, _d2 = _ks.length ? _ks[_ks.length - 1] : key;
      var _finMes = (function (k) { var y = +k.slice(0, 4), mo = +k.slice(5, 7); var d = new Date(y, mo, 0); return k + '-' + d2(d.getDate()); })(_d2);
      return {
        key: key, label: label, cerrado: true, periodo: true,
        desde: _d1 + '-01', hasta: _finMes,
        entrenos: { done: ent.done, total: ent.total, pct: ent.pct, sesiones: meses.reduce(function (a, m) { return a.concat((m.entrenos && m.entrenos.sesiones) || []); }, []).sort(function (a, b) { return (a.t || 0) - (b.t || 0); }) },
        cardio: { done: car.done, total: car.total, pct: car.pct, objetivo: obj, media: diasCar ? Math.round(pasosTot / diasCar) : 0, totalPasos: pasosTot, dias: dias },
        nutricion: { done: nut.done, total: nut.total, pct: nut.pct, dias: nutDias, conteoGrupos: conteoGrupos },
        metricas: { done: met.done, total: met.total, pct: met.pct, checkins: checkins },
        global: gp.length ? Math.round(gp.reduce(function (a, b) { return a + b; }, 0) / gp.length) : 0,
        peso: { ini: pIni2, fin: pFin2, delta: pD },
        fotos: meses.reduce(function (a, m) { return a + (m.fotos || 0); }, 0),
        ejercicios: ejercicios, semanasLbl: (function () {
          var out = [];
          for (var i = 0; i < cron.length; i += porBloque) {
            var a = cron[i], b = cron[Math.min(i + porBloque - 1, cron.length - 1)];
            var la = a.label.split(' ')[0].slice(0, 3), lb = b.label.split(' ')[0].slice(0, 3);
            out.push(porBloque === 1 ? la : (la + '–' + lb));
          }
          return out;
        })(),
        kcalObjetivo: (macros && macros.kcal) || 0
      };
    }
    // construye la lista de periodos hacia atrás (del más reciente al más antiguo)
    function periodosDe(nMeses, etiqueta) {
      var porKey = {}; resumenMeses.forEach(function (m) { porKey[m.key] = m; });
      var hoyY = now.getFullYear(), hoyM = now.getMonth();
      var out = [], guard = 0;
      var masViejo = resumenMeses.length ? resumenMeses[resumenMeses.length - 1].key : (hoyY + '-' + d2(hoyM + 1));
      var cursor = new Date(hoyY, hoyM, 1);
      while (guard++ < 40) {
        var bloque = [], primero = null;
        for (var i = 0; i < nMeses; i++) {
          var dd = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1);
          var k = dd.getFullYear() + '-' + d2(dd.getMonth() + 1);
          if (!primero) primero = dd;
          bloque.push(porKey[k] || agregaMeses([], '', k));
          if (porKey[k]) bloque[bloque.length - 1] = porKey[k];
        }
        var ultimo = new Date(cursor.getFullYear(), cursor.getMonth() - (nMeses - 1), 1);
        var lbl = etiqueta(ultimo, cursor);
        out.push(agregaMeses(bloque.filter(Boolean), lbl, 'P' + nMeses + '-' + cursor.getFullYear() + '-' + d2(cursor.getMonth() + 1)));
        cursor = new Date(cursor.getFullYear(), cursor.getMonth() - nMeses, 1);
        if ((cursor.getFullYear() + '-' + d2(cursor.getMonth() + 1)) < masViejo && out.length >= 4) break;
      }
      return out;
    }
    var MO3 = function (dt) { return MO[dt.getMonth()].slice(0, 3); };
    var resumenTrimestres = periodosDe(3, function (a, b) { return MO3(a) + '–' + MO3(b) + ' ' + b.getFullYear(); });
    var resumenSemestres  = periodosDe(6, function (a, b) { return MO3(a) + '–' + MO3(b) + ' ' + b.getFullYear(); });
    var resumenAnios      = periodosDe(12, function (a, b) { return (a.getFullYear() === b.getFullYear() ? String(b.getFullYear()) : (MO3(a) + ' ' + a.getFullYear() + ' – ' + MO3(b) + ' ' + b.getFullYear())); });

    return {
      DIET: DIET, EX: EX, WK: WK, VAR: VAR, DAYS: DAYS, APPTS: APPTS, MET: MET, VID: VID, resumenMeses: resumenMeses,
      WEIGHTS: WEIGHTS, chartLabels: chartLabels, PHOTOSETS: PHOTOSETS, SHOTS: SHOTS, SESS: SESS, DATES: DATES,
      mealsSel: mealsSel, header: header, logsInit: logsInit, logsByDate: logsByDate, doneByDate: doneByDate, lastByEx: lastByEx, checkinByDate: checkinByDate,
      todayTasks: todayTasks, planHoyPct: planHoyPct, weekSummary: weekSummary, macros: macros,
      mealsByDate: comByDate, checkinDoneThisWeek: checkinDoneThisWeek, progresoFotos: progresoFotos,
      WEEKS: WEEKS, curWeekIdx: curWeekIdx, EXPROG: EXPROG, pasosObjetivo: pasosObjetivo,
      resumenTrimestres: resumenTrimestres, resumenSemestres: resumenSemestres, resumenAnios: resumenAnios
    };
  }

  root.buildAppData = buildAppData;
  if (typeof module !== 'undefined' && module.exports) module.exports = { buildAppData: buildAppData };
})(typeof window !== 'undefined' ? window : globalThis);
