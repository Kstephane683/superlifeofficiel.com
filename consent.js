/* Consentement cookies minimal — les scripts non essentiels ne sont chargés
   qu'après « Tout accepter ». Les appels fbq/gtag faits avant l'activation
   sont mis en file puis rejoués. */
(function () {
  "use strict";
  var KEY = "superlife_consent_v1";
  var pendingFbq = [];
  var pendingGtag = [];

  function read() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function write(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
  }

  // Stubs : évitent les erreurs du JS métier avant consentement.
  if (!window.fbq) {
    window.fbq = function () { pendingFbq.push(Array.prototype.slice.call(arguments)); };
  }
  if (!window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
      pendingGtag.push(Array.prototype.slice.call(arguments));
    };
  }

  function activate() {
    var scripts = document.querySelectorAll('script[type="text/plain"][data-consent]');
    if (!scripts.length) return;
    // Le loader Meta vérifie `if (f.fbq) return` : on retire le stub avant.
    try { delete window.fbq; } catch (e) { window.fbq = undefined; }
    try { delete window.gtag; } catch (e) { window.gtag = undefined; }

    Array.prototype.forEach.call(scripts, function (old) {
      var s = document.createElement("script");
      if (old.dataset.src) {
        s.src = old.dataset.src;
        s.async = true;
      } else {
        s.text = old.textContent;
      }
      old.parentNode.replaceChild(s, old);
    });

    setTimeout(function () {
      if (typeof window.fbq === "function") {
        pendingFbq.forEach(function (args) { try { window.fbq.apply(null, args); } catch (e) {} });
        pendingFbq = [];
      }
      if (typeof window.gtag === "function") {
        pendingGtag.forEach(function (args) { try { window.gtag.apply(null, args); } catch (e) {} });
        pendingGtag = [];
      }
    }, 1500);
  }

  function banner() {
    var box = document.getElementById("sl-consent");
    if (!box) return;
    box.hidden = false;
    var accept = box.querySelector(".sl-accept");
    var refuse = box.querySelector(".sl-refuse");
    if (accept) accept.addEventListener("click", function () { write("accepted"); box.hidden = true; location.reload(); });
    if (refuse) refuse.addEventListener("click", function () { write("refused"); box.hidden = true; location.reload(); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var choice = read();
    if (choice === "accepted") {
      activate();
    } else if (choice !== "refused") {
      banner();
    }
  });
})();
