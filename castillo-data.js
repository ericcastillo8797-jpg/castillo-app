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
    if (token) token = _vigente(token);   // quien aun lleva una llave ya renovada usa la nueva sin tener que fallar antes
    if (token) h['Authorization'] = 'Bearer ' + token;
    opts.headers = h;
    return fetch(SUPA + path, opts).then(function (r) {
      return r.text().then(function (t) {
        var body; try { body = t ? JSON.parse(t) : null; } catch (e) { body = t; }
        if (!r.ok) {
          var msg = (body && (body.error_description || body.msg || body.message)) || ('Error ' + r.status);
          var err = new Error(msg); err.status = r.status;
          // Llave de la sesion caducada: se pide una nueva y se repite la peticion UNA vez (ver renuevaSesion).
          if (r.status === 401 && token && !opts._renovada && path.indexOf('/auth/v1/token') !== 0) {
            return renuevaSesion().then(function (nueva) {
              var o2 = {}; for (var k in opts) o2[k] = opts[k];
              o2.headers = Object.assign({}, opts.headers); o2._renovada = true;
              return api(path, o2, nueva);
            }, function () { throw err; });
          }
          throw err;
        }
        return body;
      });
    });
  }

  // ── LA SESION SE RENUEVA SOLA ────────────────────────────────────────────────────────────
  // La llave de la sesion dura UNA HORA y solo se renovaba al arrancar la app. Con la app abierta
  // mas de una hora (una sesion de entreno entera, con la pantalla encendida) el servidor rechazaba
  // todo lo que se guardaba: se quedaba en la cola del movil hasta cerrar la app del todo y volver
  // a abrirla, y mientras tanto la app tampoco podia leer nada nuevo. Le paso a Ben el 12 oct 2026:
  // Adrian le apunto el entreno entero, pulso Finalizar y no aparecia guardado en ningun sitio.
  // Ahora, si el servidor rechaza la llave (401), se pide una nueva y se repite la peticion.
  var _renovando = null;
  var _relevo = {};   // llave caducada -> la que la sustituye (para quien todavia lleva la vieja en la mano)
  function _vigente(t) { var n = 0; while (_relevo[t] && _relevo[t] !== t && n++ < 50) t = _relevo[t]; return t; }
  function _pideLlave(tipo, cuerpo) {
    return fetch(SUPA + '/auth/v1/token?grant_type=' + tipo, { method: 'POST', headers: { 'apikey': ANON, 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok || !j || !j.access_token) throw new Error('no renovada'); return j; }); });
  }
  function renuevaSesion() {
    if (_renovando) return _renovando;   // varias peticiones rechazadas a la vez: una sola renovacion para todas
    var s = readSession(), creds = readCreds(), vieja = _ctx.token, viejaGuardada = s && s.access_token;
    var p = (s && s.refresh_token) ? _pideLlave('refresh_token', { refresh_token: s.refresh_token }) : Promise.reject(new Error('sin sesion'));
    _renovando = p.catch(function (e) {
      // el relevo tambien ha caducado: se entra con el acceso guardado en ESTE movil (el del Face ID)
      if (creds) return _pideLlave('password', { email: creds.e, password: creds.p });
      throw e;
    }).then(function (j) {
      saveSession(j.user ? j : Object.assign({ email: _ctx.email }, j));
      if (vieja && vieja !== j.access_token) _relevo[vieja] = j.access_token;
      if (viejaGuardada && viejaGuardada !== j.access_token) _relevo[viejaGuardada] = j.access_token;
      _ctx.token = j.access_token; _renovando = null;
      return j.access_token;
    }, function (e) { _renovando = null; throw e; });
    return _renovando;
  }

  // ── DONDE SE GUARDA LA SESION ────────────────────────────────────────────────────────────
  // Desde que la app va empaquetada, sus pantallas ya no viven en una direccion de internet sino
  // dentro del movil. El almacen del navegador de iOS, en ese caso, se vacia solo (al reiniciar,
  // al actualizar). Resultado: al cliente le pedia el correo y la contraseña una y otra vez.
  // Por eso todo lo que TIENE que sobrevivir se guarda ADEMAS en el almacen nativo del telefono,
  // que no se toca nunca. localStorage sigue usandose como copia rapida (es sincrono).
  function _prefs() {
    try { var C = window.Capacitor; return (C && C.Plugins && C.Plugins.Preferences) || null; } catch (e) { return null; }
  }
  function guardaDuro(k, v) {
    try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {}
    var P = _prefs(); if (!P) return;
    try { if (v == null) P.remove({ key: k }); else P.set({ key: k, value: v }); } catch (e) {}
  }
  // Al arrancar: lo que haya en el almacen nativo se copia al del navegador, para que todo lo
  // demas siga funcionando igual (sincrono). La app espera a esta promesa antes de decidir si
  // enseña el Face ID o el formulario.
  // 'castillo_entreno' = el entreno a medias. Estaba SOLO en localStorage, que iOS borra al
  // matar la app: el cliente rellenaba 20 series, salia, volvia y lo tenia que repetir todo.
  // 'castillo_pendientes' = lo que quedo sin enviar (un entreno guardado sin cobertura, p. ej.). Se escribia en el
  // almacen nativo pero al arrancar NO se recuperaba: si iOS habia vaciado el del navegador, se perdia sin avisar
  // (12 oct 2026).
  // 'castillo_fotos_borrador' = fotos de progreso ya subidas pero aun sin pulsar «Guardar» (21 oct 2026): si la app
  // se cierra o se recarga mientras el cliente elige las demas, al volver siguen en su hueco.
  var CLAVES_DURAS = ['castillo_session', 'castillo_creds', 'castillo_lang', 'castillo_entreno', 'castillo_pendientes', 'castillo_fotos_borrador'];
  // Ademas de la sesion hay que recuperar QUE APPS tiene conectadas (Apple Salud, WHOOP). Vivian
  // solo en el navegador y se borraban en cada actualizacion: al cliente le salia "Conectar"
  // aunque ya lo tuviera conectado, y encima dejabamos de leerle los pasos hasta que lo tocara.
  function _duras() {
    var P = _prefs(); if (!P || !P.keys) return Promise.resolve(CLAVES_DURAS.slice());
    return P.keys().then(function (r) {
      var todas = CLAVES_DURAS.slice();
      ((r && r.keys) || []).forEach(function (k) {
        if (todas.indexOf(k) < 0 && (k.indexOf('salud_conectado') === 0 || k.indexOf('app_con_') === 0 || k.indexOf('salud_backfill') === 0)) todas.push(k);
      });
      return todas;
    }).catch(function () { return CLAVES_DURAS.slice(); });
  }
  var listo = (function () {
    var P = _prefs();
    if (!P) return Promise.resolve(false);
    return _duras().then(function (CLAVES) { return Promise.all(CLAVES.map(function (k) {
      return P.get({ key: k }).then(function (r) {
        var v = r && r.value;
        try {
          if (v && !localStorage.getItem(k)) localStorage.setItem(k, v);        // el movil manda
          else if (!v && localStorage.getItem(k)) P.set({ key: k, value: localStorage.getItem(k) });  // primera vez: se copia al movil
        } catch (e) {}
      }).catch(function () {});
    })); }).then(function () { return true; });
  })();

  function saveSession(s) {
    guardaDuro(LS, JSON.stringify({ access_token: s.access_token, refresh_token: s.refresh_token, email: (s.user && s.user.email) || s.email, ts: Date.now() }));
  }
  function readSession() { try { return JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) { return null; } }
  // "recuérdame": guarda el acceso en ESTE móvil para que el Face ID entre solo aunque caduque la sesión
  var CR = 'castillo_creds';
  function saveCreds(email, pass) { try { guardaDuro(CR, btoa(unescape(encodeURIComponent(JSON.stringify({ e: email, p: pass }))))); } catch (e) {} }
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
    // ruta suelta «carpeta/archivo.jpg»: así guardaba el CRM las fotos de revisión hasta el 16 oct 2026
    if (u.indexOf('://') < 0 && !/^(data|blob):/i.test(u) && u.indexOf('/') > 0) return u.replace(/^\/+/, '');
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
  // Los workouts del CRM con forma de programa, DETRÁS de los programas de verdad: si un título está
  // en los dos, manda el del programa (como hasta ahora). El transformador no cambia.
  function workoutsComoPrograma(rows) {
    var tasks = (Array.isArray(rows) ? rows : []).filter(function (w) { return w && String(w.nombre || '').trim() && Array.isArray(w.ejercicios); }).map(function (w) {
      return { type: 'workout', title: w.nombre, workout: { exercises: w.ejercicios.map(function (x) {
        return { name: x.nombre || x.name || 'Ejercicio', sets: x.sets, target: x.reps ? String(x.reps) : '', rest: x.rest, notes: x.notes || '', url_provisional: x.url || '', exerciseId: x.exerciseId };
      }) } };
    });
    return { nombre: 'Workouts', contenido: { weeks: [{ weekDays: [{ dayTasks: tasks }] }] } };
  }
  // fetch ficha del cliente + programas -> data del diseño
  function loadData(token, email) {
    var e = encodeURIComponent(String(email).toLowerCase());
    var pRow = api('/rest/v1/clientes_app?select=*&limit=1&email=ilike.' + e, {}, token);
    var pProg = api('/rest/v1/programs?select=nombre,contenido&activo=eq.true', {}, token)
      .catch(function () { return api('/rest/v1/programs?select=nombre,contenido', {}, token); });
    var pEx = api('/rest/v1/ejercicios?select=id,nombre,categoria_biblio,variantes,video_url&activo=eq.true', {}, token)
      .catch(function () { return []; });
    // entrenos creados en el CRM (Librería → Workouts): se asignan por título y no están en ningún programa (Martín, 16 oct 2026)
    var pWk = api('/rest/v1/workouts?select=nombre,ejercicios&activo=eq.true', {}, token)
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
    return Promise.all([pRow, pProg, pEx, pReg, pCom, pChk, pPerfil, pLibre, pCfg, pMet, pMedC, pWk]).then(function (res) {
      var rows = res[0] || [], programs = (res[1] || []).concat([workoutsComoPrograma(res[11] || [])]), ejercicios = res[2] || [], registros = res[3] || [];
      var comAll = res[4] || [], chkAll = res[5] || [];
      var perfilRow = (res[6] && res[6][0]) || null;
      if (!rows.length) throw new Error('No encontramos tu ficha. Avisa a Alex.');
      // SOLICITUD PENDIENTE (8 oct 2026, Alex): quien se registra queda en "Altas" y NO entra hasta que Alex lo
      // acepta en el CRM (Altas → Aceptar alta, que lo pasa a 'activo'). Hasta entonces, aviso y se queda fuera.
      if (String(rows[0].estado || '').toLowerCase() === 'alta') {
        var _en = false; try { _en = localStorage.getItem('castillo_lang') === 'en'; } catch (e) {}
        var _pe = new Error(_en ? 'Your access request is pending. Alex will review it soon: you will be able to log in as soon as he accepts it.'
                                : 'Tu solicitud de acceso está pendiente. Alex la revisará pronto: podrás entrar en cuanto la acepte.');
        _pe.pendiente = true; throw _pe;
      }
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
        _ctx.token = _vigente(token);   // si la llave se renovo mientras se cargaba, vale la nueva
        _ctx.email = String(email).toLowerCase(); _ctx.hoy = hoyStr; _ctx.tz = _tz;
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
        // Antes que nada: lo que quedo sin guardar en el intento anterior. Si el cliente apunto
        // un entreno sin cobertura, entra ahora.
        try { vaciaCola().then(function (n) { if (n && typeof _avisaCola === 'function') _avisaCola(n); }); } catch (e) {}
        try { syncZonaHoraria(); } catch (e) {}  // el movil dice en que zona horaria esta el cliente
        // Los pasos que el servidor YA tiene de cada dia (recien cargados): esos dias no hace falta volver a escribirlos.
        try { _pasosBD = {}; (registros || []).forEach(function (r) { var k = String((r && r.fecha) || '').slice(0, 10); if (k) _pasosBD[k] = { pasos: r.pasos, cardio: !!r.cardio }; }); } catch (e) {}
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
    // La plataforma real del movil: estaba fijo en 'ios' y los Android se guardaban como iPhone,
    // asi que sus avisos se habrian intentado enviar por Apple y no habrian llegado nunca (4 oct 2026).
    var _plat = 'ios';
    try { var _C2 = window.Capacitor; if (_C2 && _C2.getPlatform) _plat = _C2.getPlatform(); } catch (e) {}
    var row = { cliente_email: _ctx.email, token: token, platform: _plat, updated_at: new Date().toISOString() };
    api('/rest/v1/device_tokens?on_conflict=cliente_email,token', {
      method: 'POST', headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row)
    }, _ctx.token).catch(function () {});
  }
  function registerPush() {
    var C = window.Capacitor, PN = C && C.Plugins && C.Plugins.PushNotifications;
    if (!PN || !_ctx.email) return;   // en navegador no existe → no-op
    // En Android las notificaciones van por Firebase: el proyecto es "castillo-private" y la
    // configuracion esta en android/app/google-services.json (4 oct 2026). Si algun dia faltara
    // ese archivo, PN.register() cierra la app entera con un fallo nativo que el .catch() de aqui
    // NO atrapa. En iPhone no aplica: Apple usa su propio sistema.
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

  // ---- ZONA HORARIA: la del movil manda ----
  // El "dia" de cada cliente (cuando empieza y acaba, para los pasos y el cardio) sale de su
  // ficha. Estaba puesto a mano y no se movia nunca: si el cliente viajaba, o si simplemente
  // estaba mal, su dia empezaba a deshora y los pasos se descuadraban o se perdian. Ahora el
  // movil dice donde esta y la ficha se corrige sola.
  function syncZonaHoraria() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!tz || tz === _ctx.tz || !_ctx.token) return;
      fetch(SUPA + '/functions/v1/perfil-update', {
        method: 'POST', headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + _ctx.token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tz: tz })
      }).then(function () { _ctx.tz = tz; }).catch(function () {});
    } catch (e) {}
  }

  // ---- APPLE SALUD: pasos del día → marca el cardio (solo app nativa) ----
  var PASOS_OBJETIVO = 10000;   // objetivo por defecto (futuro: por cliente en la ficha)
  // La lectura de Apple Salud va por su cuenta y tarda: cuando arranca la app, la pantalla ya se
  // ha pintado con los pasos VIEJOS y el numero se quedaba clavado hasta la siguiente recarga.
  // Ahora, si al leer sale un numero distinto del ultimo que escribimos, se avisa a la app para
  // que se repinte. El cache evita reescribir lo mismo y evita recargar en bucle: en la segunda
  // pasada los numeros ya coinciden y no se avisa.
  var _pasosCache = {};
  var _pasosBD = {};   // { 'aaaa-mm-dd': { pasos, cardio } } = lo que tiene el servidor, de la ultima carga
  var _avisaSalud = null;
  var _avisaCola = null;
  // Una sola lectura a la vez. Al volver a la app se lanzaban dos (al recargar los datos y al reintentar) y se
  // escribia todo doble. Si llega otra peticion mientras hay una en marcha, se repite UNA vez al terminar.
  var _sincSalud = null, _sincOtra = false;
  function syncSaludPasos() {
    if (_sincSalud) { _sincOtra = true; return _sincSalud; }
    var fin = function () { _sincSalud = null; if (_sincOtra) { _sincOtra = false; return syncSaludPasos(); } };
    // Al acabar, el plugin nativo (si la app instalada ya lo trae) manda lo del reloj y deja el segundo plano en
    // marcha. Va DESPUÉS de los pasos para no escribir los dos a la vez la misma fila del día.
    _sincSalud = Promise.resolve().then(_leeYGuardaPasos).then(fin, fin).then(function (r) { try { saludFondo(); } catch (e) {} return r; });
    return _sincSalud;
  }

  // ── PASOS Y RELOJ CON LA APP CERRADA ─────────────────────────────────────────────────────────
  // Alex, 23 oct 2026: «que los pasos del Salud se actualicen solos, sin que los clientes tengan que entrar: hay
  // clientes que no entran desde hace días y no puedo ver sus pasos». Y «pon lo del Apple Watch» (calorías,
  // pulsaciones de los entrenos, sueño y entrenos, para el informe del mes).
  // Lo hace el plugin nativo CastilloSalud (app 1.0.2 en iPhone / 1.0.8 en Android): el teléfono despierta la app
  // cuando hay pasos nuevos (iPhone) o cada hora (Android) y manda los últimos 8 días a la función salud-sync.
  // Como la sesión del cliente caduca a la hora, el móvil manda con una LLAVE propia que se pide aquí, con la app
  // abierta. En una app instalada antigua (sin el plugin) todo esto no hace nada y sigue como antes.
  var _fondoUlt = 0, _fondoEnMarcha = null, _avisaReloj = null;
  function _plugSalud() { try { var C = window.Capacitor; return (C && C.Plugins && C.Plugins.CastilloSalud) || null; } catch (e) { return null; } }
  function _pideLlaveSalud() {
    return api('/functions/v1/salud-sync', { method: 'POST', body: JSON.stringify({ pedir_llave: true }) }, _ctx.token)
      .then(function (j) { if (!j || !j.ok || !j.llave) throw new Error('sin llave'); return j.llave; });
  }
  // forzar: vuelve a pedir los permisos (botón «Conectar»). nuevo: aún no consta como conectado (lo está conectando).
  function saludFondo(forzar, nuevo) {
    var P = _plugSalud();
    if (!P || !P.activar || !_ctx.email || !_ctx.token || (!nuevo && !saludConectado())) return Promise.resolve(null);
    if (_fondoEnMarcha) return _fondoEnMarcha;
    if (!forzar && Date.now() - _fondoUlt < 60000) return Promise.resolve(null);   // al volver a la app se pide dos veces seguidas
    var objetivo = (window.__DATA && window.__DATA.pasosObjetivo) || PASOS_OBJETIVO;
    _fondoEnMarcha = Promise.resolve(P.estado ? P.estado() : null).catch(function () { return null; }).then(function (e) {
      var yaListo = e && e.activo && String(e.email || '').toLowerCase() === _ctx.email;
      if (yaListo && !forzar) return P.sincronizar({ objetivo: objetivo });
      return _pideLlaveSalud().then(function (llave) {
        return P.activar({ llave: llave, url: SUPA + '/functions/v1/salud-sync', apikey: ANON, email: _ctx.email, objetivo: objetivo, forzar: !!forzar });
      });
    }).then(function (r) {
      _fondoUlt = Date.now();
      try { if (r && r.salud_escritos > 0 && typeof _avisaReloj === 'function') _avisaReloj(); } catch (e) {}
      try { if (r && r.pasos_escritos > 0 && typeof _avisaSalud === 'function') _avisaSalud(); } catch (e) {}
      return r;
    }).catch(function () { return null; }).then(function (r) { _fondoEnMarcha = null; return r; });
    return _fondoEnMarcha;
  }
  function apagaSaludFondo() {
    var P = _plugSalud();
    try { if (P && P.desactivar) P.desactivar().catch(function () {}); } catch (e) {}
    _fondoUlt = 0;
  }
  function _leeYGuardaPasos() {
    var C = window.Capacitor, H = C && C.Plugins && C.Plugins.HealthPlugin;
    if (!H || !_ctx.email || !_ctx.token) return Promise.resolve();
    if (!saludConectado()) return Promise.resolve();   // solo lee pasos si el cliente YA conectó Apple Salud (no auto-conecta ni pregunta al entrar)
    // La marca de «ya se han leido los 180 dias». Estaba declarada DENTRO de un paso y se usaba en el siguiente, donde
    // no existia: nunca llegaba a guardarse y la app leia (y reescribia) 180 dias en CADA arranque.
    var claveBF = 'salud_backfill_' + (_ctx.email || '');
    return (H.isHealthAvailable ? H.isHealthAvailable() : Promise.resolve({ available: true })).then(function (a) {
      if (a && a.available === false) return;
      return H.requestHealthPermissions({ permissions: ['READ_STEPS'] }).catch(function () {}).then(function () {
        // Apple Salud guarda el histórico entero, así que no hay motivo para leer solo la última
        // semana. La primera vez se recuperan 180 días hacia atrás (rellena todo lo que el cliente
        // caminó antes de instalar la app); después, 30 días en cada arranque.
        var now = new Date();
        var yaHecho = false; try { yaHecho = localStorage.getItem(claveBF) === '1'; } catch (e) {}
        var dias = yaHecho ? 30 : 180;
        var desde = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (dias - 1)).toISOString();
        return H.queryAggregated({ startDate: desde, endDate: now.toISOString(), dataType: 'steps', bucket: 'day' });
      }).then(function (res) {
        var buckets = (res && res.aggregatedData) || [];
        if (!buckets.length) return;
        var objetivo = (window.__DATA && window.__DATA.pasosObjetivo) || PASOS_OBJETIVO;
        var hoyF = tzToday(_ctx.tz);
        // El movil puede estar en una zona horaria distinta de la que tiene el cliente en su ficha
        // (le paso a Mar: ficha en Nueva York y telefono en España). A la 1 de la madrugada en
        // España en Nueva York es aun el dia anterior, asi que los pasos del dia nuevo se
        // descartaban por "futuros" y se perdian. Los pasos son del TELEFONO: su calendario manda.
        var hoyDisp = fechaLocalDe(new Date());
        var tope = (hoyDisp && hoyDisp > hoyF) ? hoyDisp : hoyF;
        // agrupa por fecha local: el plugin puede devolver varios trozos del mismo día
        var porDia = {};
        buckets.forEach(function (b) {
          var d = b && (b.startDate || b.date || b.start);
          var k = d ? fechaLocalDe(d) : hoyDisp || hoyF;
          if (!k || k > tope) return;                      // nunca escribe días de verdad futuros
          porDia[k] = (porDia[k] || 0) + Math.round(b.value || 0);
        });
        var conPasos = Object.keys(porDia).filter(function (k) { return porDia[k] > 0; });
        if (!conPasos.length) return;
        // uno a uno y fusionando: así no se pisa el entreno que el cliente ya guardó ese día
        // Uno a uno y fusionando: así no se pisa el entreno que el cliente ya guardó ese día,
        // y si un día falla no se lleva por delante a los demás (antes iba todo en un solo envío).
        // Alex, 12 oct 2026 (movil de Shane): «abres la aplicacion y los pasos no estan actualizados; tarda». En cada
        // arranque se reescribian UNO A UNO los 30 dias (o los 180), aunque no hubieran cambiado, y el de HOY iba el
        // ultimo: el numero bueno tardaba de 10 segundos a 2 minutos en salir. Ahora:
        //   · lo que el servidor ya tiene igual NO se vuelve a escribir (en un arranque normal solo cambia hoy);
        //   · se escribe HOY primero y luego de lo mas reciente a lo mas antiguo;
        //   · la pantalla se repinta en cuanto entra el de hoy, sin esperar al resto.
        var yaEsta = function (k) { var r = _pasosBD[k]; return !!r && r.pasos != null && Number(r.pasos) === porDia[k] && (porDia[k] < objetivo || !!r.cardio); };
        conPasos.forEach(function (k) { if (_pasosCache[k] == null && yaEsta(k)) _pasosCache[k] = porDia[k]; });
        var nuevos = conPasos.filter(function (k) { return _pasosCache[k] !== porDia[k]; }).sort().reverse();
        if (!nuevos.length) { try { guardaDuro(claveBF, '1'); } catch (e) {} return; }
        var avisa = function () { try { if (typeof _avisaSalud === 'function') _avisaSalud(); } catch (e) {} };
        return nuevos.reduce(function (p2, k, i) {
          return p2.then(function () {
            var campos = { pasos: porDia[k] };
            if (porDia[k] >= objetivo) campos.cardio = true;
            return guardaDia(k, campos).then(function () {
              _pasosCache[k] = porDia[k]; _pasosBD[k] = { pasos: porDia[k], cardio: !!campos.cardio || !!(_pasosBD[k] && _pasosBD[k].cardio) };
              if (i === 0) avisa();   // el mas reciente (hoy) ya esta guardado: que se vea ya
            }).catch(function () {});
          });
        }, Promise.resolve()).then(function () {
          try { guardaDuro(claveBF, '1'); } catch (e) {}
          if (nuevos.length > 1) avisa();   // y otra vez al acabar, por si tambien han cambiado dias anteriores
        });
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
    // Con el plugin nuevo se piden de una vez los pasos y lo del reloj (una sola ventana) y queda el segundo plano en
    // marcha; la petición de abajo ya no enseña nada porque el permiso de pasos ya está dado.
    return saludFondo(true, true).catch(function () {}).then(function () {
      return H.requestHealthPermissions({ permissions: ['READ_STEPS'] });
    }).then(function () {
      var now = new Date();
      var start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      return H.queryAggregated({ startDate: start, endDate: now.toISOString(), dataType: 'steps', bucket: 'day' });
    }).then(function (res) {
      var pasos = 0;
      if (res && res.aggregatedData && res.aggregatedData.length) pasos = Math.round(res.aggregatedData.reduce(function (s, x) { return s + (x.value || 0); }, 0));
      var objetivo = (window.__DATA && window.__DATA.pasosObjetivo) || PASOS_OBJETIVO;
      var hoyF = tzToday(_ctx.tz);   // fecha fresca en la zona del cliente
      var campos = { pasos: pasos };
      if (pasos >= objetivo) campos.cardio = true;
      try { guardaDuro('salud_conectado_' + (_ctx.email || ''), '1'); } catch (e) {}
      return guardaDia(hoyF, campos).then(function () { return { available: true, ok: true, pasos: pasos }; });
    }).catch(function () { return { available: true, ok: false }; });
  }
  // Todo lo del día (entreno, pasos, cardio) vive en la MISMA fila de entreno_registros.
  // Antes cada cosa hacía un upsert con solo sus campos y eso REEMPLAZA la fila entera: guardar
  // un entreno borraba los pasos del día, y sincronizar los pasos borraba el entreno.
  // Ahora: si la fila existe se hace PATCH (solo toca las columnas que se mandan); si no, INSERT.
  // ── COLA DE PENDIENTES ───────────────────────────────────────────────────────────────────
  // Si el guardado falla —sin cobertura en el gimnasio, sesion caducada, la app se cierra a
  // mitad— lo que apunto el cliente NO se puede perder. Antes se perdia: solo salia un aviso de
  // un segundo y ahi acababa todo. Le paso a Eric con su entreno del 31 de agosto.
  // Ahora se guarda en el movil (almacen nativo, el que sobrevive a todo) y se reintenta al
  // abrir la app y cada vez que el cliente vuelve a ella.
  var COLA = 'castillo_pendientes';
  function leeCola() { try { return JSON.parse(localStorage.getItem(COLA) || '[]') || []; } catch (e) { return []; } }
  function escribeCola(a) { guardaDuro(COLA, JSON.stringify(a || [])); }
  // ¿Dos pendientes son "lo mismo" (y entonces vale el ultimo)? Antes bastaba con que fueran del mismo tipo y del
  // mismo dia, y eso borraba cosas distintas: dos comidas del mismo dia, o las medidas y las fotos.
  function _mismoPendiente(x, y) {
    if (x.k !== y.k || x.f !== y.f) return false;
    if (x.k === 'comida' || x.k === 'descomida') return x.mealId === y.mealId;
    if (x.k === 'libre') return x.comida === y.comida;
    if (x.k === 'sustitucion') return x.comida === y.comida && x.original === y.original;
    if (x.k === 'checkin') return x.mode === y.mode;
    return true;
  }
  function encola(item) {
    var a = leeCola();
    // Lo del DIA (entreno, pasos, cardio) va todo en la misma fila y cada cosa manda solo sus columnas. Si ya habia
    // algo pendiente de ese dia se JUNTA con lo nuevo, columna a columna. Antes lo nuevo sustituia a lo anterior: un
    // entreno entero que esperaba cobertura desaparecia del movil en cuanto quedaban pendientes los pasos o el
    // cardio de ese mismo dia, y al volver la conexion solo se enviaban los pasos. Le paso a Ben el 12 oct 2026.
    if (item.k === 'dia') {
      var previo = a.filter(function (x) { return x.k === 'dia' && x.f === item.f; })[0];
      if (previo) item = Object.assign({}, item, { campos: Object.assign({}, previo.campos || {}, item.campos || {}) });
    }
    // marcar y desmarcar la misma comida: vale lo ultimo que hizo
    if (item.k === 'comida' || item.k === 'descomida') a = a.filter(function (x) { return !((x.k === 'comida' || x.k === 'descomida') && x.f === item.f && x.mealId === item.mealId); });
    a = a.filter(function (x) { return !_mismoPendiente(x, item); });
    a.push(Object.assign({ t: Date.now() }, item));
    if (a.length > 60) a = a.slice(-60);
    escribeCola(a);
  }
  // Reintenta un pendiente llamando a la MISMA funcion que lo genero, con sinCola=true para que
  // un fallo repetido no lo encole otra vez y se duplique.
  function aplicaPendiente(it) {
    if (it.k === 'dia')         return guardaDia(it.f, it.campos, true);
    if (it.k === 'comida')      return registrarComida(it.mealId, it.opcion, it.f, true);
    if (it.k === 'descomida')   return desregistrarComida(it.mealId, it.f, true);
    if (it.k === 'libre')       return guardarComidaLibre(it.comida, it.alimentos, it.f, true);
    if (it.k === 'checkin')     return CastilloData.registrarCheckin(it.valores, it.fotos, it.f, it.mode, true);
    if (it.k === 'sustitucion') return CastilloData.registrarSustitucion(it.comida, it.original, it.nuevo, it.gramos, it.macros, it.f, true);
    if (it.k === 'perfil')      return guardarPerfil(it.p, true);
    if (it.k === 'favorito')    return CastilloData.marcarFavorito(it.nombre, it.kcal, it.activar, true).then(function (ok) { return ok ? true : Promise.reject(new Error('no')); });
    return Promise.reject(new Error('tipo desconocido'));
  }
  // Devuelve cuantos se han guardado por fin, para poder avisar al cliente.
  var _vaciando = null;   // al volver a la app se pedia dos veces a la vez (al recargar y al reintentar) y se mandaba todo doble
  function vaciaCola() {
    if (_vaciando) return _vaciando;
    var a = leeCola();
    if (!a.length || !_ctx.token || !_ctx.email) return Promise.resolve(0);
    var quedan = [], hechos = 0;
    _vaciando = a.reduce(function (p, it) {
      return p.then(function () {
        return aplicaPendiente(it).then(function () { hechos++; }, function () { quedan.push(it); });
      });
    }, Promise.resolve()).then(function () {
      // lo que se haya encolado MIENTRAS se reintentaba no se pierde: se conserva junto a lo que ha vuelto a fallar
      var ahora = leeCola().filter(function (x) { return !a.some(function (y) { return y.t === x.t && y.k === x.k && y.f === x.f; }); });
      escribeCola(quedan.concat(ahora)); _vaciando = null; return hechos;
    }, function (e) { _vaciando = null; throw e; });
    return _vaciando;
  }

  // 'sinCola' evita que un reintento que vuelve a fallar se encole otra vez y se duplique.
  function guardaDia(fecha, campos, sinCola) {
    if (!_ctx.token || !_ctx.email) return Promise.reject(new Error('sin sesión'));
    var f = (/^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : _ctx.hoy);
    var e = encodeURIComponent(_ctx.email);
    var patch = Object.assign({}, campos, { updated_at: new Date().toISOString() });
    var _guardar = api('/rest/v1/entreno_registros?select=id&cliente_email=ilike.' + e + '&fecha=eq.' + f, {}, _ctx.token)
      .then(function (filas) {
        if (filas && filas.length) {
          return api('/rest/v1/entreno_registros?cliente_email=ilike.' + e + '&fecha=eq.' + f, {
            method: 'PATCH', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify(patch)
          }, _ctx.token);
        }
        return api('/rest/v1/entreno_registros', {
          method: 'POST', headers: { 'Prefer': 'return=minimal' },
          body: JSON.stringify(Object.assign({ cliente_email: _ctx.email, fecha: f, registrado_por: _ctx.email }, patch))
        }, _ctx.token);
      });
    return _guardar.catch(function (err) {
      if (!sinCola) encola({ k: 'dia', f: f, campos: patch });   // no se pierde: se reintenta
      throw err;
    });
  }

  function saludConectado() { try { return localStorage.getItem('salud_conectado_' + (_ctx.email || '')) === '1'; } catch (e) { return false; } }
  function desconectarSalud() { guardaDuro('salud_conectado_' + (_ctx.email || ''), null); apagaSaludFondo(); }
  // Estado de conexión de cada app por usuario (Apple Salud es el flag real; el resto se marca en este móvil).
  function _appKey(name) { return 'app_con_' + (_ctx.email || '') + '_' + String(name).replace(/\s+/g, '_'); }
  function appConectado(name) { if (name === 'Apple Salud') return saludConectado(); try { return localStorage.getItem(_appKey(name)) === '1'; } catch (e) { return false; } }
  // WHOOP: pide al servidor la URL de login OAuth (con el token del cliente) para abrirla.
  function conectarWhoop() {
    if (!_ctx.token) return Promise.resolve({ ok: false });
    // Hay que decirle A DONDE devolver al cliente cuando termine de identificarse en WHOOP:
    // la app instalada y la version de navegador viven en direcciones distintas, y si se equivoca
    // el cliente acaba en el navegador en vez de volver a su app.
    var enApp = false;
    try { var C = window.Capacitor; enApp = !!(C && C.isNativePlatform && C.isNativePlatform()); } catch (e) {}
    return fetch(SUPA + '/functions/v1/whoop-connect', {
      method: 'POST', headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + _ctx.token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ desde: enApp ? 'app' : 'web' })
    }).then(function (r) { return r.json(); }).catch(function () { return { ok: false }; });
  }
  function conectarApp(name) { guardaDuro(_appKey(name), '1'); }
  function desconectarApp(name) { guardaDuro(_appKey(name), null); }
  // registra (bloquea) una comida de UN DÍA (por defecto hoy): mergea meal_id->opcion en comida_registros
  function registrarComida(mealId, opcion, fecha, sinCola) {
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
    }, _ctx.token).catch(function (err) {
      if (!sinCola) encola({ k: 'comida', f: f, mealId: mealId, opcion: opcion });
      throw err;
    });
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
  function guardarComidaLibre(comida, alimentos, fecha, sinCola) {
    if (!_ctx.token || !_ctx.email) return Promise.reject(new Error('sin sesión'));
    var f = (/^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : _ctx.hoy);
    var row = { cliente_email: _ctx.email, fecha: f, comida: comida || '', alimentos: alimentos || [], registrado_por: _ctx.email, updated_at: new Date().toISOString() };
    return api('/rest/v1/comida_libre', {
      method: 'POST', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify(row)
    }, _ctx.token).catch(function (err) {
      if (!sinCola) encola({ k: 'libre', f: f, comida: comida, alimentos: alimentos });
      throw err;
    });
  }

  // cambia la contraseña del cliente (Supabase Auth). NO afecta al CRM: el CRM enlaza por EMAIL, no por contraseña.
  function cambiarPassword(pass) {
    if (!_ctx.token) return Promise.reject(new Error('sin sesión'));
    return api('/auth/v1/user', { method: 'PUT', body: JSON.stringify({ password: pass }) }, _ctx.token)
      .then(function (r) { try { var cr = readCreds(); if (cr) saveCreds(cr.e, pass); } catch (e) {} return r; }); // actualiza el Face ID guardado
  }

  // guarda el perfil del cliente (datos + foto) en Supabase (una fila por cliente)
  function guardarPerfil(p, sinCola) {
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
    }, _ctx.token).catch(function (err) {
      if (!sinCola) encola({ k: 'perfil', f: 'perfil', p: p });
      throw err;
    });
  }

  // El cliente cambia el idioma en Ajustes. Ademas de quedarse en el movil tiene que llegar a
  // su ficha, porque las NOTIFICACIONES PUSH se mandan desde el servidor y miran
  // clientes_app.settings.idioma. Sin esto, a un cliente con la app en ingles le llegaban en
  // espanol. El cliente no puede escribir en clientes_app (solo leer), por eso va por la
  // Edge Function perfil-update, que tiene permiso.
  function guardaIdioma(lang) {
    if (!_ctx.token || (lang !== 'es' && lang !== 'en')) return Promise.resolve();
    return fetch(SUPA + '/functions/v1/perfil-update', {
      method: 'POST', headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + _ctx.token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ idioma: lang })
    }).catch(function () {});
  }

  // DESmarca una comida de un día (quita el meal_id de comida_registros) — por si el cliente se equivocó
  function desregistrarComida(mealId, fecha, sinCola) {
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
    }, _ctx.token).catch(function (err) {
      if (!sinCola) encola({ k: 'descomida', f: f, mealId: mealId });
      throw err;
    });
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
    listo: listo,                 // promesa: la sesion guardada en el movil ya esta cargada
    // La app registra aqui que quiere enterarse cuando los pasos de Apple Salud cambien.
    alSincronizarSalud: function (fn) { _avisaSalud = fn; },
    // La app se entera cuando por fin se ha guardado algo que estaba pendiente, para avisar.
    alGuardarPendientes: function (fn) { _avisaCola = fn; },
    reintentaPendientes: function () { try { return vaciaCola(); } catch (e) { return Promise.resolve(0); } },
    hayPendientes: function () { try { return leeCola().length; } catch (e) { return 0; } },
    sincronizaSalud: function () { try { return syncSaludPasos(); } catch (e) { return Promise.resolve(); } },
    guardaDuro: guardaDuro,       // para el idioma, que lo escribe la pantalla de Ajustes
    emailActual: function () { return _ctx.email || ''; },   // para el borrador de fotos (que no se mezclen dos cuentas en un movil)
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
        }).catch(function (err) {
          if (err && err.pendiente) throw err;   // solicitud pendiente: que la app lo diga tal cual
          // refresh caducado: reentra con las credenciales guardadas; si no hay, pide acceder con correo
          if (creds) return passwordLogin(creds.e, creds.p).catch(function (e2) { return (e2 && e2.pendiente) ? Promise.reject(e2) : noSesion(); });
          return noSesion();
        });
      }
      return (creds ? passwordLogin(creds.e, creds.p).catch(function (e2) { return (e2 && e2.pendiente) ? Promise.reject(e2) : noSesion(); }) : noSesion());
    },
    // "¿Has olvidado tu contraseña?": pide a la Edge Function que mande el correo (Resend).
    // Siempre responde ok, exista o no la cuenta: nadie puede averiguar qué correos hay dados de alta.
    pedirResetPassword: function (email, lang) {
      return fetch(SUPA + '/functions/v1/reset-pass', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': ANON },
        body: JSON.stringify({ email: String(email || '').trim().toLowerCase(), lang: lang || 'es' })
      }).then(function (r) { return r.json().catch(function () { return { ok: true }; }); });
    },
    // El cliente vuelve del correo con los tokens en la dirección (#access_token=…&type=recovery).
    // Se guarda la sesión y se carga su ficha para que pueda poner la contraseña nueva ya dentro.
    sesionDesdeEnlace: function () {
      var h = '';
      try { h = String(window.location.hash || '').replace(/^#/, ''); } catch (e) { return Promise.reject(new Error('sin enlace')); }
      if (!h) return Promise.reject(new Error('sin enlace'));
      var p = new URLSearchParams(h);
      var at = p.get('access_token'), rt = p.get('refresh_token'), tipo = p.get('type');
      if (!at || tipo !== 'recovery') return Promise.reject(new Error('sin enlace'));
      try { window.history.replaceState(null, '', window.location.pathname + window.location.search); } catch (e) {}
      return api('/auth/v1/user', {}, at).then(function (u) {
        var em = (u && u.email) || '';
        saveSession({ access_token: at, refresh_token: rt, email: em });
        return loadData(at, em);
      });
    },
    logout: function () { apagaSaludFondo(); try { guardaDuro(LS, null); guardaDuro(CR, null); guardaDuro('castillo_fotos_borrador', null); localStorage.removeItem('castillo_profile'); localStorage.removeItem('castillo_profilephoto'); Object.keys(localStorage).forEach(function (k) { if (k.indexOf('salud_conectado') === 0 || k.indexOf('app_con_') === 0) localStorage.removeItem(k); }); } catch (e) {} _ctx = { token: null, email: null, hoy: null }; window.__DATA = null; },
    registrarComida: registrarComida,
    desregistrarComida: desregistrarComida,
    guardarPerfil: guardarPerfil, guardaIdioma: guardaIdioma,
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
    marcarFavorito: function (nombre, kcal, activar, sinCola) {
      if (!_ctx.token || !_ctx.email || !nombre) return Promise.resolve(false);
      var alFallar = function () {
        if (!sinCola) encola({ k: 'favorito', f: 'fav:' + nombre, nombre: nombre, kcal: kcal, activar: !!activar });
        return false;
      };
      if (activar) {
        return api('/rest/v1/alimentos_favoritos?on_conflict=cliente_email,nombre', {
          method: 'POST', headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify({ cliente_email: _ctx.email, nombre: nombre, kcal: Number(kcal) || 0 })
        }, _ctx.token).then(function () { return true; }).catch(alFallar);
      }
      var e = encodeURIComponent(_ctx.email), n = encodeURIComponent(nombre);
      return api('/rest/v1/alimentos_favoritos?cliente_email=ilike.' + e + '&nombre=eq.' + n, { method: 'DELETE', headers: { 'Prefer': 'return=minimal' } }, _ctx.token)
        .then(function () { return true; }).catch(alFallar);
    },
    guardarComidaLibre: guardarComidaLibre,
    conectarSalud: conectarSalud,
    saludConectado: saludConectado,
    desconectarSalud: desconectarSalud,
    appConectado: appConectado,
    // Datos reales de WHOOP (recuperación, sueño, esfuerzo y entrenos). El servidor renueva
    // el permiso solo, así que desde aquí no hay que gestionar nada.
    // Sin argumentos: los últimos 7 días (tarjeta de Progreso).
    // Con (desde, hasta) en formato AAAA-MM-DD: el rango del informe (mes, trimestre, semestre o año).
    whoopDatos: function (desde, hasta) {
      if (!_ctx.token) return Promise.resolve(null);
      var cuerpo = desde ? JSON.stringify({ desde: desde, hasta: hasta || desde }) : '{}';
      return fetch(SUPA + '/functions/v1/whoop-datos', {
        method: 'POST', headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: 'Bearer ' + _ctx.token }, body: cuerpo
      }).then(function (r) { return r.json(); }).catch(function () { return null; });
    },
    // Lo del reloj (Apple Salud / Health Connect): calorías activas, pulso en reposo, sueño y entrenos, un día por
    // fila (tabla salud_dia, la escribe el móvil por su cuenta). Con (desde, hasta) AAAA-MM-DD. Si aún no hay nada
    // (o la tabla no existe todavía) devuelve una lista vacía.
    saludDatos: function (desde, hasta) {
      if (!_ctx.token || !_ctx.email) return Promise.resolve([]);
      var q = '/rest/v1/salud_dia?select=fecha,kcal_activas,pulso_reposo,sueno_min,entrenos,origen&cliente_email=eq.' + encodeURIComponent(_ctx.email) + '&order=fecha.asc';
      if (desde) q += '&fecha=gte.' + desde;
      if (hasta) q += '&fecha=lte.' + hasta;
      return api(q, {}, _ctx.token).then(function (r) { return Array.isArray(r) ? r : []; }).catch(function () { return []; });
    },
    alSincronizarReloj: function (fn) { _avisaReloj = fn; },
    saludFondo: function () { try { return saludFondo(); } catch (e) { return Promise.resolve(null); } },
    estadoSaludFondo: function () { var P = _plugSalud(); return (P && P.estado) ? P.estado().catch(function () { return null; }) : Promise.resolve(null); },
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
      var campos = { titulo: titulo || 'Entrenamiento', ejercicios: ejercicios || [], estado: completo ? 'completado' : 'en_progreso' };
      if (!_ctx.token || !_ctx.email) {
        // La sesion aun no esta lista (la app esta arrancando o reconectando): el entreno NO se tira, queda pendiente
        // en el movil y se envia solo. Antes se rechazaba sin guardarlo en ningun sitio.
        var f0 = (/^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : _ctx.hoy);
        if (f0) encola({ k: 'dia', f: f0, campos: Object.assign({}, campos, { updated_at: new Date().toISOString() }) });
        return Promise.reject(new Error('sin sesión'));
      }
      var f = (/^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : _ctx.hoy);
      return guardaDia(f, campos);
    },
    // guarda el check-in de HOY (peso, medidas y fotos) que apunta el cliente
    // mode: 'medidas' (solo valores) | 'fotos' (solo fotos) | 'both'. SIEMPRE fusiona con lo ya guardado
    // de ese día: así subir fotos NO borra las medidas (ni al revés), que era el bug.
    registrarCheckin: function (valores, fotos, fecha, mode, sinCola) {
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
        }).catch(function (err) {
          // Las medidas y las fotos de progreso NO se pueden perder: si falla, al movil y se
          // reintenta. Antes solo salia "No se pudo guardar" y adios.
          if (!sinCola) encola({ k: 'checkin', f: f, valores: valores, fotos: fotos, mode: m });
          throw err;
        });
    },
    // registra una sustitución de alimento del día (equivalencias); lo verá el entrenador en el CRM
    registrarSustitucion: function (comida, original, nuevo, gramos, macros, fecha, sinCola) {
      if (!_ctx.token || !_ctx.email) return Promise.reject(new Error('sin sesión'));
      var mc = macros || {};
      var f = (/^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : _ctx.hoy);
      var row = { cliente_email: _ctx.email, fecha: f, comida: comida || '', original: original || '', nuevo: nuevo || '', gramos: (gramos != null ? gramos : null), kcal_new: (mc.kcal != null ? mc.kcal : null), p_new: (mc.p != null ? mc.p : null), c_new: (mc.c != null ? mc.c : null), g_new: (mc.g != null ? mc.g : null), registrado_por: _ctx.email, updated_at: new Date().toISOString() };
      return api('/rest/v1/sustituciones_dieta?on_conflict=cliente_email,fecha,comida,original', {
        method: 'POST', headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row)
      }, _ctx.token).catch(function (err) {
        if (!sinCola) encola({ k: 'sustitucion', f: f, comida: comida, original: original, nuevo: nuevo, gramos: gramos, macros: mc });
        throw err;
      });
    },
    // sube una FOTO de progreso al almacenamiento (bucket 'progreso') y devuelve su URL pública
    // (21 oct 2026, Carlos Martins: «a veces se suben y a veces no»). Antes, si la conexion se quedaba
    // colgada, la foto se quedaba en «Cargando…» para siempre; si la sesion habia caducado fallaba sin
    // renovarla; y si la foto SI subia pero la firma del enlace no llegaba, se daba por no subida.
    // Ahora: espera maxima, dos reintentos si se corta, llave nueva si caduco la sesion, y si la firma
    // no llega la foto vale igual (se usa el enlace normal, que la app firma al cargar).
    // alSubir(url): se llama en cuanto la foto esta en el servidor, antes de la firma (borrador del movil).
    subirFotoProgreso: function (file, slot, alSubir) {
      if (!_ctx.token || !_ctx.email) return Promise.reject(new Error('sin sesión'));
      var safe = ((file && file.name) || 'foto').replace(/[^a-zA-Z0-9._-]/g, '_');
      var carpeta = _ctx.email.replace(/[^a-z0-9]/gi, '_');
      var path = carpeta + '/' + _ctx.hoy + '-' + (slot || 'foto') + '-' + Date.now() + '-' + safe;
      var normal = SUPA + '/storage/v1/object/public/progreso/' + encodeURI(path);
      function conEspera(url, opts, ms) {
        var ctl = null; try { ctl = new AbortController(); opts.signal = ctl.signal; } catch (e) {}
        var reloj;
        return Promise.race([
          fetch(url, opts),
          new Promise(function (_, mal) { reloj = setTimeout(function () { try { if (ctl) ctl.abort(); } catch (e) {} mal(new Error('tarda demasiado')); }, ms); })
        ]).then(function (r) { clearTimeout(reloj); return r; }, function (e) { clearTimeout(reloj); throw e; });
      }
      function sube(intento, renovada) {
        return conEspera(SUPA + '/storage/v1/object/progreso/' + encodeURI(path), {
          method: 'POST',
          headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + _vigente(_ctx.token), 'Content-Type': (file && file.type) || 'application/octet-stream', 'x-upsert': 'true' },
          body: file
        }, 120000).then(function (r) {
          if (r.ok) return true;
          return r.text().catch(function () { return ''; }).then(function (txt) {
            // sesion caducada: el almacen contesta 400/401/403 («exp», «jwt»…). Llave nueva y otra vez.
            if (!renovada && (r.status === 401 || r.status === 403 || (r.status === 400 && /exp|jwt|token|unauthori/i.test(txt)))) {
              return renuevaSesion().then(function () { return sube(intento, true); });
            }
            var e = new Error('No se pudo subir la foto'); e.status = r.status; e.respuesta = true; throw e;
          });
        }, function (err) {
          // se corto la conexion o tardo demasiado: se reintenta (misma ruta, x-upsert: no se duplica)
          if (intento < 2) return new Promise(function (ya) { setTimeout(ya, 1500); }).then(function () { return sube(intento + 1, renovada); });
          throw err;
        });
      }
      return sube(0, false).then(function () {
        try { if (alSubir) alSubir(normal); } catch (e) {}
        // bucket privado: devolver enlace FIRMADO para que se vea al instante (re-firmable después)
        return conEspera(SUPA + '/storage/v1/object/sign/progreso/' + encodeURI(path), {
          method: 'POST', headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + _vigente(_ctx.token), 'Content-Type': 'application/json' },
          body: JSON.stringify({ expiresIn: 604800 })
        }, 12000).then(function (s) { return s.ok ? s.json() : null; }).then(function (j) {
          return (j && j.signedURL) ? (SUPA + '/storage/v1' + j.signedURL) : normal;
        }, function () { return normal; });
      });
    },
    // marca/desmarca el cardio de un día (se guarda en la MISMA fila diaria de entreno_registros, columna cardio)
    registrarCardio: function (fecha, done) {
      if (!_ctx.token || !_ctx.email) return Promise.reject(new Error('sin sesión'));
      var f = (/^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : _ctx.hoy);
      var campos = { cardio: !!done };
      var objetivo = (window.__DATA && window.__DATA.pasosObjetivo) || PASOS_OBJETIVO;
      // Pasos que YA hay guardados ese dia. Antes se miraba 'logsDia.pasosReales', que no existe
      // en ningun sitio: salia siempre undefined, asi que marcar el cardio a mano PISABA los
      // pasos de verdad de Apple Salud y los dejaba en el objetivo.
      var yaHay = null;
      try { var r = (window.__DATA && window.__DATA.regByDate && window.__DATA.regByDate[f]) || null;
            yaHay = r && r.pasos != null ? (parseInt(r.pasos, 10) || 0) : null; } catch (e) {}
      if (done) {
        // Solo se rellena con el objetivo si NO hay lectura real (se dejo el movil en casa).
        if (yaHay == null || yaHay === 0) campos.pasos = objetivo;
      } else {
        // Al desmarcar: si lo que hay es EXACTAMENTE lo que pusimos nosotros, se quita, para que
        // vuelvan a mandar los pasos de Apple Salud. Si es una lectura real, no se toca.
        if (yaHay === objetivo) campos.pasos = null;
      }
      return guardaDia(f, campos).then(function (x) {
        if (!done) {
          // OJO: syncSaludPasos lleva un cache para no reescribir lo mismo una y otra vez. Si no
          // se le borra la entrada de ESE dia, cree que ya lo tiene guardado y NO vuelve a
          // escribirlo, asi que el dia se quedaba vacio y no habia forma de recuperar el numero
          // de Apple Salud hasta reiniciar la app. Es justo lo que le pasaba a Eric.
          try { delete _pasosCache[f]; delete _pasosBD[f]; } catch (e) {}
          try { syncSaludPasos(); } catch (e) {}
        }
        return x;
      });
    }
  };
  // Marca el documento como Android para que el CSS pueda separar las pestanas de abajo de la
  // barra del sistema (atras / inicio / apps), que en Android ocupa sitio y las tapaba.
  try {
    var _C = window.Capacitor;
    if (_C && _C.getPlatform && _C.getPlatform() === 'android') document.documentElement.classList.add('es-android');
  } catch (e) {}
  window.CastilloData = CastilloData;
})();
