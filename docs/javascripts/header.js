(function () {
  var root = document.documentElement;
  var ticking = false;

  function isHomePage() {
    return document.querySelector(".home") !== null;
  }

  function syncHeaderState() {
    ticking = false;

    var home = isHomePage();
    root.classList.toggle("zx-home-page", home);
    root.classList.toggle("zx-doc-scrolled", !home && window.scrollY > 1);
  }

  function requestSync() {
    if (ticking) {
      return;
    }

    ticking = true;
    window.requestAnimationFrame(syncHeaderState);
  }

  window.addEventListener("scroll", requestSync, { passive: true });
  window.addEventListener("resize", requestSync);
  document.addEventListener("DOMContentLoaded", syncHeaderState);

  if (typeof document$ !== "undefined") {
    document$.subscribe(function () {
      syncHeaderState();
      window.setTimeout(syncHeaderState, 80);
    });
  }

  syncHeaderState();
}());
