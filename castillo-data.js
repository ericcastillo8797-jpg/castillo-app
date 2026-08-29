/* castillo-data.js — auth real (Supabase GoTrue) + carga de datos del cliente + transform.
   Expone window.CastilloData: loginAndLoad(email,pass), restoreSession(), hasSession(), logout(). */
(function () {
  'use strict';
  var SUPA = 'https://pdplhtmhwfqgpyiofujt.supabase.co';
  var ANON = 'sb_publishable_0vGKDo8tHn-jf88-CZb1UA_dTKD4mkx';
  var LS = 'castillo_session';

  function api(path, opts, token) {
    opts = opts || {};
    var h = opts.headers || {};
    h['apikey'] = ANON;
    h['Content-Type'] = 'application/json';
    if (token) h['Authorization'] = 'Bearer ' + token;
    opts.headers = h;
    return fetch(SUPA + path, opts).then(function (r) {
      return r.text().then(function (t) {
        var body; try { body = t ? JSON.parse(t) : null; } catch (e) { body = t; }
        if (!r.ok) {
          var msg = (body && (body.error_description || body.msg || body.message)) || ('Error ' + r.status);
          var err = new Error(msg); err.status = r.status; throw err;
        }
        return body;
      });
    });
  }

  function saveSession(s) {
    try { localStorage.setItem(LS, JSON.stringify({ access_token: s.access_token, refresh_token: s.refresh_token, email: (s.user && s.user.email) || s.email, ts: Date.now() })); } catch (e) {}
  }
  function readSession() { try { return JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) { return null; } }
  // "recuérdame": guarda el acceso en ESTE móvil para que el Face ID entre solo aunque caduque la sesión
  var CR = 'castillo_creds';
  function saveCreds(email, pass) { try { localStorage.setItem(CR, btoa(unescape(encodeURIComponent(JSON.stringify({ e: email, p: pass }))))); } catch (e) {} }
  function readCreds() { try { var v = localStorage.getItem(CR); if (!v) return null; return JSON.parse(decodeURIComponent(escape(atob(v)))); } catch (e) { return null; } }

  function friendly(msg) {
    if (/invalid login|credentials/i.test(msg)) return 'Correo o contraseña incorrectos';
    if (/email not confirmed/i.test(msg)) return 'Cuenta sin confirmar. Avisa a Alex.';
    return msg;
  }

  // Saca el PATH de una URL del bucket 'progreso', sea pública (/object/public/progreso/) o firmada (/object/sign/progreso/?token). null si es externa.
  function _progresoPath(u) {
    if (typeof u !== 'string') return null;
    var marks = ['/object/public/progreso/', '/object/sign/progreso/'];
    for (var m = 0; m < marks.length; m++) { var i = u.indexOf(marks[m]); if (i >= 0) { var p = u.slice(i + marks[m].length); var q = p.indexOf('?'); if (q >= 0) p = p.slice(0, q); return decodeURIComponent(p); } }
    return null;
  }
  // Firma URLs del bucket privado 'progreso' → enlaces firmados temporales (7 días). Las externas se dejan igual.
  function _signMap(urls, token) {
    var paths = [];
    (urls || []).forEach(function (u) { var p = _progresoPath(u); if (p && paths.indexOf(p) < 0) paths.push(p); });
    if (!paths.length) return Promise.resolve({});
    return fetch(SUPA + '/storage/v1/object/sign/progreso', {
      method: 'POST', headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn: 604800, paths: paths })
    }).then(function (r) { return r.ok ? r.json() : []; }).then(function (arr) {
      var byPath = {}; (arr || []).forEach(function (o) { if (o && o.path && o.signedURL) byPath[o.path] = SUPA + '/storage/v1' + o.signedURL; });
      var map = {};
      (urls || []).forEach(function (u) { var p = _progresoPath(u); if (p && byPath[p]) map[u] = byPath[p]; });
      return map;
    }).catch(function () { return {}; });
  }

  // Re-firma UNA foto del bucket 'progreso' (para reintentar si el WebView falla al cargarla). Devuelve una URL firmada fresca o null.
  function reSignPhoto(url) {
    var p = _progresoPath(url);
    if (!p || !_ctx.token) return Promise.resolve(null);
    return fetch(SUPA + '/storage/v1/object/sign/progreso', {
      method: 'POST', headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + _ctx.token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn: 604800, paths: [p] })
    }).then(function (r) { return r.ok ? r.json() : []; }).then(function (arr) {
      var o = (arr || [])[0]; return (o && o.signedURL) ? SUPA + '/storage/v1' + o.signedURL : null;
    }).catch(function () { return null; });
  }
  // fecha de HOY (YYYY-MM-DD) en la ZONA HORARIA DEL CLIENTE (no la del dispositivo)
  function tzToday(tz) {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
    catch (e) { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  }
  // fetch ficha del cliente + programas -> data del diseño
  function loadData(token, email) {
    var e = encodeURIComponent(String(email).toLowerCase());
    var pRow = api('/rest/v1/clientes_app?select=*&limit=1&email=ilike.' + e, {}, token);
    var pProg = api('/rest/v1/programs?select=nombre,contenido&activo=eq.true', {}, token)
      .catch(function () { return api('/rest/v1/programs?select=nombre,contenido', {}, token); });
    var pEx = api('/rest/v1/ejercicios?select=id,nombre,categoria_biblio,variantes,video_url&activo=eq.true', {}, token)
      .catch(function () { return []; });
    var pReg = api('/rest/v1/entreno_registros?select=*&cliente_email=ilike.' + e + '&order=fecha.asc', {}, token)
      .catch(function () { return []; });
    var hoy = new Date(); var hoyStr = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
    // TODOS los registros de comida (para el cumplimiento SEMANAL de nutrición, no solo hoy)
    var pCom = api('/rest/v1/comida_registros?select=*&cliente_email=ilike.' + e + '&order=fecha.asc', {}, token)
      .catch(function () { return []; });
    // check-ins del cliente (peso/medidas que apunta él en la app)
    var pChk = api('/rest/v1/checkin_registros?select=*&cliente_email=ilike.' + e + '&order=fecha.asc', {}, token)
      .catch(function () { return []; });
    // perfil del cliente (foto + datos personales que rellena en Ajustes)
    var pPerfil = api('/rest/v1/perfil_cliente?select=*&cliente_email=ilike.' + e + '&limit=1', {}, token)
      .catch(function () { return []; });
    // comidas libres / cheat meals (para las kcal del desglose mensual)
    var pLibre = api('/rest/v1/comida_libre?select=fecha,comida,alimentos&cliente_email=ilike.' + e + '&order=fecha.asc', {}, token)
      .catch(function () { return []; });
    // config de medidas (qué medidas rellena el cliente) — la edita Alex en el CRM; si no hay, la app usa su lista por defecto
    var pCfg = api('/rest/v1/app_config?select=valor&clave=eq.medidas&limit=1', {}, token)
      .catch(function () { return []; });
    // métricas PERSONALIZADAS de este cliente (las crea Alex en el CRM) — se añaden a su registro de medidas
    var pMet = api('/rest/v1/metricas_cliente?select=key,label,unit,objetivo,orden&cliente_email=ilike.' + e + '&order=orden.asc&order=created_at.asc', {}, token)
      .catch(function () { return []; });
    // set de medidas PROPIO de este cliente (si Alex se lo ha personalizado); si no hay, se usa la base global
    var pMedC = api('/rest/v1/medidas_cliente_cfg?select=grupos&cliente_email=ilike.' + e + '&limit=1', {}, token)
      .catch(function () { return []; });
    return Promise.all([pRow, pProg, pEx, pReg, pCom, pChk, pPerfil, pLibre, pCfg, pMet, pMedC]).then(function (res) {
      var rows = res[0] || [], programs = res[1] || [], ejercicios = res[2] || [], registros = res[3] || [];
      var comAll = res[4] || [], chkAll = res[5] || [];
      var perfilRow = (res[6] && res[6][0]) || null;
      if (!rows.length) throw new Error('No encontramos tu ficha. Avisa a Alex.');
      if (!window.buildAppData) throw new Error('Falta el transformador de datos');
      // Fotos privadas: firmar las URLs del bucket 'progreso' (checkins + históricas + perfil) ANTES de montar la vista.
      var toSign = [];
      chkAll.forEach(function (c) { if (c.fotos) Object.keys(c.fotos).forEach(function (k) { if (c.fotos[k]) toSign.push(c.fotos[k]); }); });
      var hrow = rows[0];
      var _tz = (hrow && hrow.tz) || 'America/New_York';   // zona horaria del cliente (presencial = Miami)
      hoyStr = tzToday(_tz);   // "hoy" según la zona del CLIENTE, no el dispositivo
      if (hrow && hrow.evolution && hrow.evolution.photos) hrow.evolution.photos.forEach(function (p) { ['front_url', 'side_url', 'back_url'].forEach(function (f) { if (p[f]) toSign.push(p[f]); }); });
      if (perfilRow && perfilRow.foto) toSign.push(perfilRow.foto);
      return _signMap(toSign, token).then(function (map) {
        var swap = function (u) { return (u && map[u]) ? map[u] : u; };
        chkAll.forEach(function (c) { if (c.fotos) Object.keys(c.fotos).forEach(function (k) { c.fotos[k] = swap(c.fotos[k]); }); });
        if (hrow && hrow.evolution && hrow.evolution.photos) hrow.evolution.photos.forEach(function (p) { p.front_url = swap(p.front_url); p.side_url = swap(p.side_url); p.back_url = swap(p.back_url); });
        if (perfilRow && perfilRow.foto) perfilRow.foto = swap(perfilRow.foto);
        var comReg = comAll.filter(function (r) { return (r.fecha || '').slice(0, 10) === hoyStr; })[0] || null;
        var data = window.buildAppData(rows[0], programs, ejercicios, registros, comAll, chkAll, (res[7] || []), (res[9] || []));
        data.mealsReg = (comReg && comReg.comidas) || {};   // { meal_id: opcion } registradas HOY (bloqueadas)
        var chkHoy = chkAll.filter(function (r) { return (r.fecha || '').slice(0, 10) === hoyStr; })[0] || null;
        data.checkinHoy = (chkHoy && chkHoy.valores) || {};   // valores ya registrados hoy (para prerellenar)
        data.checkinFotosHoy = (chkHoy && chkHoy.fotos) || {};   // fotos ya subidas hoy (firmadas)
        // Perfil de Ajustes: usa lo que el cliente haya editado (perfil_cliente); y lo que falte, lo SIEMBRA de su ficha
        // (clientes_app) — así un cliente nuevo del alta ve sus datos ya rellenos (nombre, apellidos, teléfono, nacimiento).
        (function () {
          var pr = perfilRow || {};
          var seed = {
            nombre: hrow.nombre || '', apellidos: hrow.apellido || '',
            fecha_nac: hrow.birthdate ? String(hrow.birthdate).slice(0, 10) : '',
            prefijo: hrow.prefix || '', telefono: hrow.telefono || ''
          };
          var merged = {};
          Object.keys(seed).forEach(function (k) { merged[k] = (pr[k] != null && pr[k] !== '') ? pr[k] : seed[k]; });
          merged.foto = pr.foto || null; merged.nombre_publico = pr.nombre_publico || '';
          data.perfil = merged;
        })();
        _ctx.token = token; _ctx.email = String(email).toLowerCase(); _ctx.hoy = hoyStr; _ctx.tz = _tz;
        // Sincroniza el estado "WHOOP conectado" con la tabla real (por si conectó/desconectó en otro sitio)
        api('/rest/v1/whoop_tokens?select=cliente_email&limit=1&cliente_email=ilike.' + encodeURIComponent(_ctx.email), {}, token)
          .then(function (rows) { try { var k = 'app_con_' + _ctx.email + '_WHOOP'; if (rows && rows.length) localStorage.setItem(k, '1'); else localStorage.removeItem(k); } catch (e) {} })
          .catch(function () {});
        // Medidas del cliente: manda SU set propio (medidas_cliente_cfg); si no tiene, la base global (app_config)
        var _setPropio = (res[10] && res[10][0] && res[10][0].grupos) || null;
        data.medidasConfig = _setPropio ? { grupos: _setPropio } : ((res[8] && res[8][0] && res[8][0].valor) || null);   // {grupos:[{g,f:[{key,label,unit}]}]}
        data.customMetrics = res[9] || [];   // métricas personalizadas del cliente [{key,label,unit,objetivo}]
        window.__DATA = data;
        try { registerPush(); } catch (e) {}   // registra el móvil para notificaciones (solo app nativa)
        try { syncSaludPasos(); } catch (e) {}   // lee pasos de Apple Salud → marca cardio (solo app nativa)
        return data;
      });
    });
  }

  var _ctx = { token: null, email: null, hoy: null };

  // ---- NOTIFICACIONES PUSH (solo en la app nativa; en web no hace nada) ----
  var _pushInit = false;
  function saveDeviceToken(token) {
    if (!token || !_ctx.email || !_ctx.token) return;
    var row = { cliente_email: _ctx.email, token: token, platform: 'ios', updated_at: new Date().toISOString() };
    api('/rest/v1/device_tokens?on_conflict=cliente_email,token', {
      method: 'POST', headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row)
    }, _ctx.token).catch(function () {});
  }
  function registerPush() {
    var C = window.Capacitor, PN = C && C.Plugins && C.Plugins.PushNotifications;
    if (!PN || !_ctx.email) return;   // en navegador no existe → no-op
    if (!_pushInit) {
      _pushInit = true;
      try {
        PN.addListener('registration', function (t) { saveDeviceToken(t && t.value); });
        PN.addListener('registrationError', function () {});
      } catch (e) {}
    }
    (PN.checkPermissions ? PN.checkPermissions() : Promise.resolve({ receive: 'prompt' })).then(function (p) {
      if (p && (p.receive === 'prompt' || p.receive === 'prompt-with-rationale')) return PN.requestPermissions();
      return p;
    }).then(function (p) { if (p && p.receive === 'granted') PN.register(); }).catch(function () {});
  }

  // ---- APPLE SALUD: pasos del día → marca el cardio (solo app nativa) ----
  var PASOS_OBJETIVO = 10000;   // objetivo por defecto (futuro: por cliente en la ficha)
  function syncSaludPasos() {
    var C = window.Capacitor, H = C && C.Plugins && C.Plugins.HealthPlugin;
    if (!H || !_ctx.email || !_ctx.token) return Promise.resolve();
    if (!saludConectado()) return Promise.resolve();   // solo lee pasos si el cliente YA conectó Apple Salud (no auto-conecta ni pregunta al entrar)
    return (H.isHealthAvailable ? H.isHealthAvailable() : Promise.resolve({ available: true })).then(function (a) {
      if (a && a.available === false) return;
      return H.requestHealthPermissions({ permissions: ['READ_STEPS'] }).catch(function () {}).then(function () {
        // Antes solo se leía HOY: si el cliente no abría la app un día, esos pasos se perdían para
        // siempre. Ahora se recuperan los últimos 7 días de una sola consulta, día a día.
        var now = new Date();
        var desde = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString();
        return H.queryAggregated({ startDate: desde, endDate: now.toISOString(), dataType: 'steps', bucket: 'day' });
      }).then(function (res) {
        var buckets = (res && res.aggregatedData) || [];
        if (!buckets.length) return;
        var objetivo = (window.__DATA && window.__DATA.pasosObjetivo) || PASOS_OBJETIVO;
        var hoyF = tzToday(_ctx.tz);
        // agrupa por fecha local: el plugin puede devolver varios trozos del mismo día
        var porDia = {};
        buckets.forEach(function (b) {
          var d = b && (b.startDate || b.date || b.start);
          var k = d ? fechaLocalDe(d) : hoyF;
          if (!k || k > hoyF) return;                      // nunca escribe días futuros
          porDia[k] = (porDia[k] || 0) + Math.round(b.value || 0);
        });
        var filas = Object.keys(porDia).filter(function (k) { return porDia[k] > 0; }).map(function (k) {
          var row = { cliente_email: _ctx.email, fecha: k, pasos: porDia[k], registrado_por: _ctx.email, updated_at: new Date().toISOString() };
          if (porDia[k] >= objetivo) row.cardio = true;     // llegó a SU objetivo → cardio hecho
          return row;
        });
        if (!filas.length) return;
        return api('/rest/v1/entreno_registros?on_conflict=cliente_email,fecha', {
          method: 'POST', headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(filas)
        }, _ctx.token);
      });
    }).catch(function () {});
  }
  // fecha LOCAL (no UTC) de lo que devuelva el plugin: si se pasa a UTC, la medianoche se va al día anterior
  function fechaLocalDe(v) {
    try {
      var d = new Date(v);
      if (isNaN(d)) return null;
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    } catch (e) { return null; }
  }
  // Conexión MANUAL de Apple Salud (botón "Conectar"): pide permiso, lee pasos de hoy y marca cardio. Devuelve {available, ok, pasos}.
  function conectarSalud() {
    var C = window.Capacitor, H = C && C.Plugins && C.Plugins.HealthPlugin;
    if (!H || !_ctx.email || !_ctx.token) return Promise.resolve({ available: !!H });
    return H.requestHealthPermissions({ permissions: ['READ_STEPS'] }).then(function () {
      var now = new Date();
      var start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      return H.queryAggregated({ startDate: start, endDate: now.toISOString(), dataType: 'steps', bucket: 'day' });
    }).then(function (res) {
      var pasos = 0;
      if (res && res.aggregatedData && res.aggregatedData.length) pasos = Math.round(res.aggregatedData.reduce(function (s, x) { return s + (x.value || 0); }, 0));
      var objetivo = (window.__DATA && window.__DATA.pasosObjetivo) || PASOS_OBJETIVO;
      var hoyF = tzToday(_ctx.tz);   // fecha fresca en la zona del cliente
      var row = { cliente_email: _ctx.email, fecha: hoyF, pasos: pasos, registrado_por: _ctx.email, updated_at: new Date().toISOString() };
      if (pasos >= objetivo) row.cardio = true;
      try { localStorage.setItem('salud_conectado_' + (_ctx.email || ''), '1'); } catch (e) {}
      return api('/rest/v1/entreno_registros?on_conflict=cliente_email,fecha', {
        method: 'POST', headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row)
      }, _ctx.token).then(function () { return { available: true, ok: true, pasos: pasos }; });
    }).catch(function () { return { available: true, ok: false }; });
  }
  function saludConectado() { try { return localStorage.getItem('salud_conectado_' + (_ctx.email || '')) === '1'; } catch (e) { return false; } }
  function desconectarSalud() { try { localStorage.removeItem('salud_conectado_' + (_ctx.email || '')); } catch (e) {} }
  // Estado de conexión de cada app por usuario (Apple Salud es el flag real; el resto se marca en este móvil).
  function _appKey(name) { return 'app_con_' + (_ctx.email || '') + '_' + String(name).replace(/\s+/g, '_'); }
  function appConectado(name) { if (name === 'Apple Salud') return saludConectado(); try { return localStorage.getItem(_appKey(name)) === '1'; } catch (e) { return false; } }
  // WHOOP: pide al servidor la URL de login OAuth (con el token del cliente) para abrirla.
  function conectarWhoop() {
    if (!_ctx.token) return Promise.resolve({ ok: false });
    return fetch(SUPA + '/functions/v1/whoop-connect', {
      method: 'POST', headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + _ctx.token, 'Content-Type': 'application/json' }
    }).then(function (r) { return r.json(); }).catch(function () { return { ok: false }; });
  }
  function conectarApp(name) { try { localStorage.setItem(_appKey(name), '1'); } catch (e) {} }
  function desconectarApp(name) { try { localStorage.removeItem(_appKey(name)); } catch (e) {} }
  // registra (bloquea) una comida de UN DÍA (por defecto hoy): mergea meal_id->opcion en comida_registros
  function registrarComida(mealId, opcion, fecha) {
    if (!_ctx.token || !_ctx.email) return Promise.reject(new Error('sin sesión'));
    var f = (/^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : _ctx.hoy);
    var byDate = (window.__DATA && window.__DATA.mealsByDate) || {};
    var comidas = Object.assign({}, byDate[f] || {}); comidas[mealId] = opcion;
    if (window.__DATA) {
      window.__DATA.mealsByDate = Object.assign({}, byDate, { [f]: comidas });
      if (f === _ctx.hoy) window.__DATA.mealsReg = comidas;   // compat pantalla de hoy
    }
    var row = { cliente_email: _ctx.email, fecha: f, comidas: comidas, registrado_por: _ctx.email, updated_at: new Date().toISOString() };
    return api('/rest/v1/comida_registros?on_conflict=cliente_email,fecha', {
      method: 'POST', headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row)
    }, _ctx.token);
  }

  // ---- Buscador de alimentos (comida libre / cheat meal) ----
  // Va por un PROXY seguro en Supabase (Edge Function 'food-search'): la clave USDA vive como secreto en
  // Supabase, NO en este código público. El proxy busca en USDA, mapea y devuelve [{nombre,kcal,prot,carbs,fat}].
  function buscarAlimentos(query) {
    var url = SUPA + '/functions/v1/food-search?q=' + encodeURIComponent(query || '');
    var h = { 'apikey': ANON };
    if (_ctx.token) h['Authorization'] = 'Bearer ' + _ctx.token;   // el proxy exige usuario logueado
    return fetch(url, { headers: h }).then(function (r) { return r.json(); }).then(function (list) {
      return Array.isArray(list) ? list : [];
    }).catch(function () { return []; });
  }
  // alimentos que el cliente ya usó en cheat meals antes (para mostrarlos primero, sin re-buscar)
  function alimentosRecientes() {
    if (!_ctx.token || !_ctx.email) return Promise.resolve([]);
    var e = encodeURIComponent(_ctx.email);
    return api('/rest/v1/comida_libre?select=alimentos,updated_at&cliente_email=ilike.' + e + '&order=updated_at.desc&limit=40', {}, _ctx.token).then(function (rows) {
      var seen = {}, out = [];
      (rows || []).forEach(function (r) {
        (r.alimentos || []).forEach(function (a) {
          var k = String(a.nombre || '').toLowerCase(); if (!k || seen[k]) return; seen[k] = 1;
          var k100 = (a.kcal100 != null) ? a.kcal100 : (a.gramos > 0 ? Math.round((a.kcal || 0) / a.gramos * 100) : (a.kcal || 0));
          out.push({ nombre: a.nombre, kcal: k100 });
        });
      });
      return out.slice(0, 15);
    }).catch(function () { return []; });
  }

  // guarda una comida libre / cheat meal del día: alimentos elegidos + marca esa comida como registrada ('libre')
  function guardarComidaLibre(comida, alimentos, fecha) {
    if (!_ctx.token || !_ctx.email) return Promise.reject(new Error('sin sesión'));
    var f = (/^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : _ctx.hoy);
    var row = { cliente_email: _ctx.email, fecha: f, comida: comida || '', alimentos: alimentos || [], registrado_por: _ctx.email, updated_at: new Date().toISOString() };
    return api('/rest/v1/comida_libre', {
      method: 'POST', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify(row)
    }, _ctx.token);
  }

  // cambia la contraseña del cliente (Supabase Auth). NO afecta al CRM: el CRM enlaza por EMAIL, no por contraseña.
  function cambiarPassword(pass) {
    if (!_ctx.token) return Promise.reject(new Error('sin sesión'));
    return api('/auth/v1/user', { method: 'PUT', body: JSON.stringify({ password: pass }) }, _ctx.token)
      .then(function (r) { try { var cr = readCreds(); if (cr) saveCreds(cr.e, pass); } catch (e) {} return r; }); // actualiza el Face ID guardado
  }

  // guarda el perfil del cliente (datos + foto) en Supabase (una fila por cliente)
  function guardarPerfil(p) {
    if (!_ctx.token || !_ctx.email) return Promise.reject(new Error('sin sesión'));
    p = p || {};
    var row = { cliente_email: _ctx.email, nombre: p.nombre || null, apellidos: p.apellidos || null, nombre_publico: p.nombrePublico || null, fecha_nac: p.fechaNac || null, prefijo: p.prefijo || null, telefono: p.telefono || null, foto: p.foto || null, updated_at: new Date().toISOString() };
    // Propaga nombre/apellidos/teléfono a la ficha del CRM (clientes_app + clientes) con el JWT del cliente (Edge Function service role).
    try {
      fetch(SUPA + '/functions/v1/perfil-update', {
        method: 'POST', headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + _ctx.token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: p.nombre || '', apellido: p.apellidos || '', telefono: p.telefono || '', prefix: p.prefijo || '' })
      }).catch(function () {});
    } catch (e) {}
    return api('/rest/v1/perfil_cliente?on_conflict=cliente_email', {
      method: 'POST', headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row)
    }, _ctx.token);
  }

  // DESmarca una comida de un día (quita el meal_id de comida_registros) — por si el cliente se equivocó
  function desregistrarComida(mealId, fecha) {
    if (!_ctx.token || !_ctx.email) return Promise.reject(new Error('sin sesión'));
    var f = (/^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : _ctx.hoy);
    var byDate = (window.__DATA && window.__DATA.mealsByDate) || {};
    var comidas = Object.assign({}, byDate[f] || {}); delete comidas[mealId];
    if (window.__DATA) {
      window.__DATA.mealsByDate = Object.assign({}, byDate, { [f]: comidas });
      if (f === _ctx.hoy) window.__DATA.mealsReg = comidas;
    }
    var row = { cliente_email: _ctx.email, fecha: f, comidas: comidas, registrado_por: _ctx.email, updated_at: new Date().toISOString() };
    return api('/rest/v1/comida_registros?on_conflict=cliente_email,fecha', {
      method: 'POST', headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row)
    }, _ctx.token);
  }

  // login con correo+contraseña (guarda sesión + credenciales para el Face ID)
  function passwordLogin(email, pass) {
    return api('/auth/v1/token?grant_type=password', {
      method: 'POST', body: JSON.stringify({ email: String(email).trim(), password: pass })
    }).then(function (s) {
      saveSession(s); saveCreds(String(email).trim(), pass);
      return loadData(s.access_token, (s.user && s.user.email) || email);
    });
  }

  var CastilloData = {
    // el Face ID solo entra si ya hay una sesión/credenciales guardadas en ESTE móvil (tras acceder una vez con correo)
    hasSession: function () { return !!(readSession() || readCreds()); },
    loginAndLoad: function (email, pass) {
      return passwordLogin(email, pass).catch(function (e) { e.message = friendly(e.message || ''); throw e; });
    },
    // Face ID / reapertura: reusa la sesión; si caducó, reentra solo con las credenciales guardadas de este móvil
    restoreSession: function () {
      var s = readSession(), creds = readCreds();
      var noSesion = function () { return Promise.reject(new Error('Accede con tu correo la primera vez')); };
      if (s && s.refresh_token) {
        return api('/auth/v1/token?grant_type=refresh_token', {
          method: 'POST', body: JSON.stringify({ refresh_token: s.refresh_token })
        }).then(function (ns) {
          saveSession(ns);
          return loadData(ns.access_token, (ns.user && ns.user.email) || s.email);
        }).catch(function () {
          // refresh caducado: reentra con las credenciales guardadas; si no hay, pide acceder con correo
          if (creds) return passwordLogin(creds.e, creds.p).catch(noSesion);
          return noSesion();
        });
      }
      return (creds ? passwordLogin(creds.e, creds.p).catch(noSesion) : noSesion());
    },
    logout: function () { try { localStorage.removeItem(LS); localStorage.removeItem(CR); localStorage.removeItem('castillo_profile'); localStorage.removeItem('castillo_profilephoto'); Object.keys(localStorage).forEach(function (k) { if (k.indexOf('salud_conectado') === 0 || k.indexOf('app_con_') === 0) localStorage.removeItem(k); }); } catch (e) {} _ctx = { token: null, email: null, hoy: null }; window.__DATA = null; },
    registrarComida: registrarComida,
    desregistrarComida: desregistrarComida,
    guardarPerfil: guardarPerfil,
    cambiarPassword: cambiarPassword,
    // Borrado de cuenta (obligatorio para la App Store). El email NO se manda: lo saca la función
    // del propio JWT. Aquí solo viaja lo que el cliente ha escrito para confirmar.
    borrarCuenta: function (confirmacion) {
      if (!_ctx.token) return Promise.reject(new Error('Sin sesión'));
      return fetch(SUPA + '/functions/v1/borrar-cuenta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: 'Bearer ' + _ctx.token },
        body: JSON.stringify({ confirmacion: confirmacion || '' })
      }).then(function (r) { return r.json().catch(function () { return { ok: false, error: 'Respuesta no válida' }; }); })
        .then(function (j) { if (!j || !j.ok) throw new Error((j && j.error) || 'No se pudo borrar la cuenta'); return j; });
    },
    miEmail: function () { return _ctx.email || ''; },
    buscarAlimentos: buscarAlimentos,
    alimentosRecientes: alimentosRecientes,
    // Favoritos del cliente: los alimentos que repite siempre, para no buscarlos cada vez.
    alimentosFavoritos: function () {
      if (!_ctx.token || !_ctx.email) return Promise.resolve([]);
      var e = encodeURIComponent(_ctx.email);
      return api('/rest/v1/alimentos_favoritos?select=nombre,kcal&cliente_email=ilike.' + e + '&order=created_at.desc', {}, _ctx.token)
        .then(function (r) { return (r || []).map(function (x) { return { nombre: x.nombre, kcal: Number(x.kcal) || 0, fav: true }; }); })
        .catch(function () { return []; });
    },
    marcarFavorito: function (nombre, kcal, activar) {
      if (!_ctx.token || !_ctx.email || !nombre) return Promise.resolve(false);
      if (activar) {
        return api('/rest/v1/alimentos_favoritos?on_conflict=cliente_email,nombre', {
          method: 'POST', headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify({ cliente_email: _ctx.email, nombre: nombre, kcal: Number(kcal) || 0 })
        }, _ctx.token).then(function () { return true; }).catch(function () { return false; });
      }
      var e = encodeURIComponent(_ctx.email), n = encodeURIComponent(nombre);
      return api('/rest/v1/alimentos_favoritos?cliente_email=ilike.' + e + '&nombre=eq.' + n, { method: 'DELETE', headers: { 'Prefer': 'return=minimal' } }, _ctx.token)
        .then(function () { return true; }).catch(function () { return false; });
    },
    guardarComidaLibre: guardarComidaLibre,
    conectarSalud: conectarSalud,
    saludConectado: saludConectado,
    desconectarSalud: desconectarSalud,
    appConectado: appConectado,
    // Datos reales de WHOOP (recuperación, sueño, esfuerzo y entrenos). El servidor renueva
    // el permiso solo, así que desde aquí no hay que gestionar nada.
    whoopDatos: function () {
      if (!_ctx.token) return Promise.resolve(null);
      return fetch(SUPA + '/functions/v1/whoop-datos', {
        method: 'POST', headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: 'Bearer ' + _ctx.token }, body: '{}'
      }).then(function (r) { return r.json(); }).catch(function () { return null; });
    },
    conectarApp: conectarApp,
    desconectarApp: desconectarApp,
    conectarWhoop: conectarWhoop,
    reSignPhoto: reSignPhoto,
    // recarga los datos del cliente (registros, comidas...) y reconstruye __DATA con los conteos frescos
    reload: function () {
      if (!_ctx.token || !_ctx.email) return Promise.reject(new Error('sin sesión'));
      return loadData(_ctx.token, _ctx.email);
    },
    // guarda el entreno de HOY que apunta el cliente en su app (mismo sitio que el CRM: entreno_registros)
    registrarEntreno: function (titulo, ejercicios, completo, fecha) {
      if (!_ctx.token || !_ctx.email) return Promise.reject(new Error('sin sesión'));
      var f = (/^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : _ctx.hoy);
      var row = { cliente_email: _ctx.email, fecha: f, titulo: titulo || 'Entrenamiento', ejercicios: ejercicios || [], estado: completo ? 'completado' : 'en_progreso', registrado_por: _ctx.email, updated_at: new Date().toISOString() };
      return api('/rest/v1/entreno_registros?on_conflict=cliente_email,fecha', {
        method: 'POST', headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row)
      }, _ctx.token);
    },
    // guarda el check-in de HOY (peso, medidas y fotos) que apunta el cliente
    // mode: 'medidas' (solo valores) | 'fotos' (solo fotos) | 'both'. SIEMPRE fusiona con lo ya guardado
    // de ese día: así subir fotos NO borra las medidas (ni al revés), que era el bug.
    registrarCheckin: function (valores, fotos, fecha, mode) {
      if (!_ctx.token || !_ctx.email) return Promise.reject(new Error('sin sesión'));
      var f = (/^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : _ctx.hoy);
      var m = (mode === 'medidas' || mode === 'fotos') ? mode : 'both';
      return api('/rest/v1/checkin_registros?select=valores,fotos&cliente_email=ilike.' + encodeURIComponent(_ctx.email) + '&fecha=eq.' + f + '&limit=1', {}, _ctx.token)
        .catch(function () { return []; })
        .then(function (prev) {
          var p = (prev && prev[0]) || {};
          var pv = p.valores || {}, pf = p.fotos || {};
          var outV = (m === 'fotos') ? pv : Object.assign({}, pv, valores || {});     // añadir/actualizar medidas sin perder las previas
          var outF = (m === 'medidas') ? pf : (fotos || {});                          // en fotos manda lo que hay en pantalla (permite quitar)
          var row = { cliente_email: _ctx.email, fecha: f, valores: outV, fotos: outF, registrado_por: _ctx.email, updated_at: new Date().toISOString() };
          if (window.__DATA && f === _ctx.hoy) { window.__DATA.checkinHoy = outV; window.__DATA.checkinFotosHoy = outF; }
          return api('/rest/v1/checkin_registros?on_conflict=cliente_email,fecha', {
            method: 'POST', headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row)
          }, _ctx.token);
        });
    },
    // registra una sustitución de alimento del día (equivalencias); lo verá el entrenador en el CRM
    registrarSustitucion: function (comida, original, nuevo, gramos, macros, fecha) {
      if (!_ctx.token || !_ctx.email) return Promise.reject(new Error('sin sesión'));
      var mc = macros || {};
      var f = (/^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : _ctx.hoy);
      var row = { cliente_email: _ctx.email, fecha: f, comida: comida || '', original: original || '', nuevo: nuevo || '', gramos: (gramos != null ? gramos : null), kcal_new: (mc.kcal != null ? mc.kcal : null), p_new: (mc.p != null ? mc.p : null), c_new: (mc.c != null ? mc.c : null), g_new: (mc.g != null ? mc.g : null), registrado_por: _ctx.email, updated_at: new Date().toISOString() };
      return api('/rest/v1/sustituciones_dieta?on_conflict=cliente_email,fecha,comida,original', {
        method: 'POST', headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row)
      }, _ctx.token);
    },
    // sube una FOTO de progreso al almacenamiento (bucket 'progreso') y devuelve su URL pública
    subirFotoProgreso: function (file, slot) {
      if (!_ctx.token || !_ctx.email) return Promise.reject(new Error('sin sesión'));
      var safe = ((file && file.name) || 'foto').replace(/[^a-zA-Z0-9._-]/g, '_');
      var carpeta = _ctx.email.replace(/[^a-z0-9]/gi, '_');
      var path = carpeta + '/' + _ctx.hoy + '-' + (slot || 'foto') + '-' + Date.now() + '-' + safe;
      return fetch(SUPA + '/storage/v1/object/progreso/' + encodeURI(path), {
        method: 'POST',
        headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + _ctx.token, 'Content-Type': (file && file.type) || 'application/octet-stream', 'x-upsert': 'true' },
        body: file
      }).then(function (r) {
        if (!r.ok) throw new Error('No se pudo subir la foto');
        // bucket privado: devolver enlace FIRMADO para que se vea al instante (re-firmable después)
        return fetch(SUPA + '/storage/v1/object/sign/progreso/' + encodeURI(path), {
          method: 'POST', headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + _ctx.token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ expiresIn: 604800 })
        }).then(function (s) { return s.ok ? s.json() : null; }).then(function (j) {
          return (j && j.signedURL) ? (SUPA + '/storage/v1' + j.signedURL) : (SUPA + '/storage/v1/object/public/progreso/' + encodeURI(path));
        });
      });
    },
    // marca/desmarca el cardio de un día (se guarda en la MISMA fila diaria de entreno_registros, columna cardio)
    registrarCardio: function (fecha, done) {
      if (!_ctx.token || !_ctx.email) return Promise.reject(new Error('sin sesión'));
      var f = (/^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : _ctx.hoy);
      var row = { cliente_email: _ctx.email, fecha: f, cardio: !!done, registrado_por: _ctx.email, updated_at: new Date().toISOString() };
      // marca MANUAL del cardio → cuenta el objetivo de pasos (regla de Alex)
      var objetivo = (window.__DATA && window.__DATA.pasosObjetivo) || PASOS_OBJETIVO;
      if (done) row.pasos = objetivo;
      return api('/rest/v1/entreno_registros?on_conflict=cliente_email,fecha', {
        method: 'POST', headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row)
      }, _ctx.token);
    }
  };
  window.CastilloData = CastilloData;
})();
