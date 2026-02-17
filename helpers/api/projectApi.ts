import { urls } from "@/utils/urls";
import { APIRequestContext, expect } from "@playwright/test";

export async function fetchAllProjectCount(
  request: APIRequestContext,
  token: string
): Promise<any[]> {

  let page = 1;
  let allItems: any[] = [];
  let total = Infinity;
  let pageSize = 0;

  while (allItems.length < total) {
    const res = await request.post(
      `https://api.t.jamargig.com/api/casting/projects/search?page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    expect(res.status()).toBe(200);

    const body = await res.json();

    const items = body.data || [];
    const meta = body.meta || body;

    total = meta.total ?? total;
    pageSize = items.length;

    console.log(`Page ${page} → ${items.length} items (total: ${total})`);

    allItems.push(...items);

    // stop if last page reached
    if (items.length === 0) break;
    if (allItems.length >= total) break;

    page++;
  }

  console.log("FINAL TOTAL:", allItems.length);
  return allItems;
}


export async function getPublishedProjects(
  request: APIRequestContext,
  token: string
): Promise<{ count: number; names: string[] }> {

  let page = 1;
  let all: any[] = [];
  let total = Infinity;

  while (all.length < total) {
    const res = await request.post(
      urls.casting_base + `projects/search?page=${page}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    expect(res.status()).toBe(200);

    const body = await res.json();

    const items = body.data || [];
    total = body.total ?? total;

    all.push(...items);

    if (all.length >= total) break;
    page++;
  }

  // 🔎 filter published
  const published = all.filter(p => p.is_published === true);

  const names = published.map(p => p.title);
  const count = published.length;

  console.log("Published count:", count);
  console.log("Published names:", names);

  return { count, names };
}

