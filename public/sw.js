// Service worker do Assistente Diário — só trata de notificações push.
// Não faz cache de nada (sem funcionalidade offline por agora).

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Caminho base do deploy (ex: "/AssitenteDiario/" no GitHub Pages, "/" em
// localhost/domínio próprio) — tirado do scope do próprio SW, para não
// ficar hardcoded e partir se o local de deploy mudar.
const BASE_PATH = new URL(self.registration.scope).pathname;

self.addEventListener("push", (event) => {
  let payload = { title: "Assistente Diário", body: "Tens um lembrete." };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // payload sem JSON válido — usa os valores por omissão acima.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: `${BASE_PATH}icon.svg`,
      badge: `${BASE_PATH}icon.svg`,
      data: { url: payload.url || `${BASE_PATH}calendario` },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl =
    event.notification.data && event.notification.data.url ? event.notification.data.url : BASE_PATH;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});
