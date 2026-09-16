self.addEventListener("push", (event) => {
  let title = "New activity in task";
  try {
    const data = event.data ? event.data.json() : {};
    if (data && data.title) title = data.title;
  } catch {
    /* keep default */
  }
  event.waitUntil(self.registration.showNotification("Aeko", { body: title }));
});
