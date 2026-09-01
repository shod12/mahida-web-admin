'use strict';

const MAHIDA_ADMIN_URL =
  'https://script.google.com/macros/s/AKfycbzzm1txakGC5DQTidoQr3UdPNi4k9y8YDn9UNokKXhmJ6Lj9xyPseKd2kaJ2nL_qU2KEw/exec?pwa=1';

let deferredInstallPrompt = null;
let frameLoadTimer = null;

const frame = document.getElementById('mahidaAdminFrame');
const loading = document.getElementById('shellLoading');
const error = document.getElementById('shellError');
const retryButton = document.getElementById('retryButton');
const installButton = document.getElementById('installButton');

function isStandalone_() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function showLoading_() {
  if (loading) loading.classList.remove('hidden');
  if (error) error.classList.add('hidden');
}

function showFrame_() {
  window.clearTimeout(frameLoadTimer);
  if (loading) loading.classList.add('hidden');
  if (error) error.classList.add('hidden');
}

function showError_() {
  if (loading) loading.classList.add('hidden');
  if (error) error.classList.remove('hidden');
}

function loadAdmin_() {
  showLoading_();

  if (!frame) {
    showError_();
    return;
  }

  const cacheBust = Date.now();
  frame.src = MAHIDA_ADMIN_URL + '&shell=' + cacheBust;

  window.clearTimeout(frameLoadTimer);
  frameLoadTimer = window.setTimeout(function () {
    showError_();
  }, 20000);
}

if (frame) {
  frame.addEventListener('load', function () {
    showFrame_();
  });
}

if (retryButton) {
  retryButton.addEventListener('click', loadAdmin_);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./service-worker.js').catch(function () {
      /* PWA shell tetap dapat digunakan online bila registrasi SW gagal. */
    });
  });
}

window.addEventListener('beforeinstallprompt', function (event) {
  event.preventDefault();
  deferredInstallPrompt = event;

  if (installButton && !isStandalone_()) {
    installButton.classList.remove('hidden');
  }
});

if (installButton) {
  installButton.addEventListener('click', async function () {
    if (!deferredInstallPrompt) return;

    installButton.disabled = true;

    try {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
    } finally {
      deferredInstallPrompt = null;
      installButton.disabled = false;
      installButton.classList.add('hidden');
    }
  });
}

window.addEventListener('appinstalled', function () {
  deferredInstallPrompt = null;
  if (installButton) installButton.classList.add('hidden');
});

if (isStandalone_() && installButton) {
  installButton.classList.add('hidden');
}

showLoading_();
