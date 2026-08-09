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

  // fetch ficha del cliente + programas -> data del diseño
  function loadData(token, email) {
    var e = encodeURIComponent(String(email).toLowerCase());
    var pRow = api('/rest/v1/harbiz_clientes?select=*&limit=1&email=ilike.' + e, {}, token);
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
    return Promise.all([pRow, pProg, pEx, pReg, pCom, pChk, pPerfil]).then(function (res) {
      var rows = res[0] || [], programs = res[1] || [], ejercicios = res[2] || [], registros = res[3] || [];
      var comAll = res[4] || [], chkAll = res[5] || [];
      var comReg = comAll.filter(function (r) { return (r.fecha || '').slice(0, 10) === hoyStr; })[0] || null;
      if (!rows.length) throw new Error('No encontramos tu ficha. Avisa a Alex.');
      if (!window.buildAppData) throw new Error('Falta el transformador de datos');
      var data = window.buildAppData(rows[0], programs, ejercicios, registros, comAll, chkAll);
      data.mealsReg = (comReg && comReg.comidas) || {};   // { meal_id: opcion } registradas HOY (bloqueadas)
      var chkHoy = chkAll.filter(function (r) { return (r.fecha || '').slice(0, 10) === hoyStr; })[0] || null;
      data.checkinHoy = (chkHoy && chkHoy.valores) || {};   // valores ya registrados hoy (para prerellenar)
      data.checkinFotosHoy = (chkHoy && chkHoy.fotos) || {};   // fotos ya subidas hoy
      data.perfil = (res[6] && res[6][0]) || null;   // perfil (foto + datos) guardado en Supabase
      _ctx.token = token; _ctx.email = String(email).toLowerCase(); _ctx.hoy = hoyStr;
      window.__DATA = data;
      return data;
    });
  }

  var _ctx = { token: null, email: null, hoy: null };
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
    return fetch(url, { headers: { 'apikey': ANON } }).then(function (r) { return r.json(); }).then(function (list) {
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
    logout: function () { try { localStorage.removeItem(LS); localStorage.removeItem(CR); } catch (e) {} window.__DATA = null; },
    registrarComida: registrarComida,
    desregistrarComida: desregistrarComida,
    guardarPerfil: guardarPerfil,
    cambiarPassword: cambiarPassword,
    buscarAlimentos: buscarAlimentos,
    alimentosRecientes: alimentosRecientes,
    guardarComidaLibre: guardarComidaLibre,
    // recarga los datos del cliente (registros, comidas...) y reconstruye __DATA con los conteos frescos
    reload: function () {
      if (!_ctx.token || !_ctx.email) return Promise.reject(new Error('sin sesión'));
      return loadData(_ctx.token, _ctx.email);
    },
    // guarda el entreno de HOY que apunta el cliente en su app (mismo sitio que el CRM: entreno_registros)
    registrarEntreno: function (titulo, ejercicios, completo) {
      if (!_ctx.token || !_ctx.email) return Promise.reject(new Error('sin sesión'));
      var row = { cliente_email: _ctx.email, fecha: _ctx.hoy, titulo: titulo || 'Entrenamiento', ejercicios: ejercicios || [], estado: completo ? 'completado' : 'en_progreso', registrado_por: _ctx.email, updated_at: new Date().toISOString() };
      return api('/rest/v1/entreno_registros?on_conflict=cliente_email,fecha', {
        method: 'POST', headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row)
      }, _ctx.token);
    },
    // guarda el check-in de HOY (peso, medidas y fotos) que apunta el cliente
    registrarCheckin: function (valores, fotos) {
      if (!_ctx.token || !_ctx.email) return Promise.reject(new Error('sin sesión'));
      var row = { cliente_email: _ctx.email, fecha: _ctx.hoy, valores: valores || {}, fotos: fotos || {}, registrado_por: _ctx.email, updated_at: new Date().toISOString() };
      if (window.__DATA) { window.__DATA.checkinHoy = valores || {}; window.__DATA.checkinFotosHoy = fotos || {}; }
      return api('/rest/v1/checkin_registros?on_conflict=cliente_email,fecha', {
        method: 'POST', headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row)
      }, _ctx.token);
    },
    // registra una sustitución de alimento del día (equivalencias); lo verá el entrenador en el CRM
    registrarSustitucion: function (comida, original, nuevo, gramos, macros) {
      if (!_ctx.token || !_ctx.email) return Promise.reject(new Error('sin sesión'));
      var mc = macros || {};
      var row = { cliente_email: _ctx.email, fecha: _ctx.hoy, comida: comida || '', original: original || '', nuevo: nuevo || '', gramos: (gramos != null ? gramos : null), kcal_new: (mc.kcal != null ? mc.kcal : null), p_new: (mc.p != null ? mc.p : null), c_new: (mc.c != null ? mc.c : null), g_new: (mc.g != null ? mc.g : null), registrado_por: _ctx.email, updated_at: new Date().toISOString() };
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
      }).then(function (r) { if (!r.ok) throw new Error('No se pudo subir la foto'); return SUPA + '/storage/v1/object/public/progreso/' + encodeURI(path); });
    },
    // marca/desmarca el cardio de un día (se guarda en la MISMA fila diaria de entreno_registros, columna cardio)
    registrarCardio: function (fecha, done) {
      if (!_ctx.token || !_ctx.email) return Promise.reject(new Error('sin sesión'));
      var f = (/^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : _ctx.hoy);
      var row = { cliente_email: _ctx.email, fecha: f, cardio: !!done, registrado_por: _ctx.email, updated_at: new Date().toISOString() };
      return api('/rest/v1/entreno_registros?on_conflict=cliente_email,fecha', {
        method: 'POST', headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row)
      }, _ctx.token);
    }
  };
  window.CastilloData = CastilloData;
})();
