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
    var pCom = api('/rest/v1/comida_registros?select=*&cliente_email=ilike.' + e + '&fecha=eq.' + hoyStr, {}, token)
      .catch(function () { return []; });
    return Promise.all([pRow, pProg, pEx, pReg, pCom]).then(function (res) {
      var rows = res[0] || [], programs = res[1] || [], ejercicios = res[2] || [], registros = res[3] || [];
      var comReg = (res[4] || [])[0] || null;
      if (!rows.length) throw new Error('No encontramos tu ficha. Avisa a Alex.');
      if (!window.buildAppData) throw new Error('Falta el transformador de datos');
      var data = window.buildAppData(rows[0], programs, ejercicios, registros);
      data.mealsReg = (comReg && comReg.comidas) || {};   // { meal_id: opcion } registradas HOY (bloqueadas)
      _ctx.token = token; _ctx.email = String(email).toLowerCase(); _ctx.hoy = hoyStr;
      window.__DATA = data;
      return data;
    });
  }

  var _ctx = { token: null, email: null, hoy: null };
  // registra (bloquea) una comida de HOY: mergea meal_id->opcion en comida_registros
  function registrarComida(mealId, opcion) {
    if (!_ctx.token || !_ctx.email) return Promise.reject(new Error('sin sesión'));
    var cur = (window.__DATA && window.__DATA.mealsReg) || {};
    var comidas = Object.assign({}, cur); comidas[mealId] = opcion;
    if (window.__DATA) window.__DATA.mealsReg = comidas;
    var row = { cliente_email: _ctx.email, fecha: _ctx.hoy, comidas: comidas, registrado_por: _ctx.email, updated_at: new Date().toISOString() };
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
    // el Face ID "funciona" si hay sesión guardada O credenciales recordadas en este móvil
    hasSession: function () { var s = readSession(); return !!((s && s.access_token && s.email) || readCreds()); },
    loginAndLoad: function (email, pass) {
      return passwordLogin(email, pass).catch(function (e) { e.message = friendly(e.message || ''); throw e; });
    },
    // Face ID / reapertura: reusa la sesión; si caducó, reentra solo con las credenciales guardadas
    restoreSession: function () {
      var s = readSession(), creds = readCreds();
      var fallback = function () { return creds ? passwordLogin(creds.e, creds.p) : Promise.reject(new Error('Accede con tu correo la primera vez')); };
      if (s && s.refresh_token) {
        return api('/auth/v1/token?grant_type=refresh_token', {
          method: 'POST', body: JSON.stringify({ refresh_token: s.refresh_token })
        }).then(function (ns) {
          saveSession(ns);
          return loadData(ns.access_token, (ns.user && ns.user.email) || s.email);
        }).catch(function () {
          // refresh caducado -> reentra con credenciales guardadas; si no, con el access_token viejo
          return creds ? passwordLogin(creds.e, creds.p) : loadData(s.access_token, s.email);
        });
      }
      return fallback();
    },
    logout: function () { try { localStorage.removeItem(LS); localStorage.removeItem(CR); } catch (e) {} window.__DATA = null; },
    registrarComida: registrarComida,
    // guarda el entreno de HOY que apunta el cliente en su app (mismo sitio que el CRM: entreno_registros)
    registrarEntreno: function (titulo, ejercicios, completo) {
      if (!_ctx.token || !_ctx.email) return Promise.reject(new Error('sin sesión'));
      var row = { cliente_email: _ctx.email, fecha: _ctx.hoy, titulo: titulo || 'Entrenamiento', ejercicios: ejercicios || [], estado: completo ? 'completado' : 'en_progreso', registrado_por: _ctx.email, updated_at: new Date().toISOString() };
      return api('/rest/v1/entreno_registros?on_conflict=cliente_email,fecha', {
        method: 'POST', headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row)
      }, _ctx.token);
    }
  };
  window.CastilloData = CastilloData;
})();
