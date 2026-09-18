export async function webSearch(query: string) {
  const res = await fetch("/api/tools/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: query.slice(0, 180) }),
  });
  if (!res.ok) throw new Error(`search ${res.status}`);
  const json = (await res.json()) as { text: string };
  return `web_search:\n${json.text}`;
}

export async function httpFetch(url: string) {
  const res = await fetch("/api/tools/fetch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const json = (await res.json()) as { text: string };
  return `http_fetch:\n${json.text}`;
}
