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
    return Promise.all([pRow, pProg]).then(function (res) {
      var rows = res[0] || [], programs = res[1] || [];
      if (!rows.length) throw new Error('No encontramos tu ficha. Avisa a Alex.');
      if (!window.buildAppData) throw new Error('Falta el transformador de datos');
      var data = window.buildAppData(rows[0], programs);
      window.__DATA = data;
      return data;
    });
  }

  var CastilloData = {
    hasSession: function () { var s = readSession(); return !!(s && s.access_token && s.email); },
    loginAndLoad: function (email, pass) {
      return api('/auth/v1/token?grant_type=password', {
        method: 'POST', body: JSON.stringify({ email: String(email).trim(), password: pass })
      }).then(function (s) {
        saveSession(s);
        return loadData(s.access_token, (s.user && s.user.email) || email);
      }).catch(function (e) { e.message = friendly(e.message || ''); throw e; });
    },
    // Face ID / reapertura: reusa sesión guardada (refresca token si hace falta)
    restoreSession: function () {
      var s = readSession();
      if (!s || !s.refresh_token) return Promise.reject(new Error('Accede con tu correo la primera vez'));
      return api('/auth/v1/token?grant_type=refresh_token', {
        method: 'POST', body: JSON.stringify({ refresh_token: s.refresh_token })
      }).then(function (ns) {
        saveSession(ns);
        return loadData(ns.access_token, (ns.user && ns.user.email) || s.email);
      }).catch(function () {
        // si el refresh falla pero el access_token aún vale, intenta con él
        return loadData(s.access_token, s.email);
      });
    },
    logout: function () { try { localStorage.removeItem(LS); } catch (e) {} window.__DATA = null; }
  };
  window.CastilloData = CastilloData;
})();
