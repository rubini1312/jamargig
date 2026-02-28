import { getProjectPayload } from "@/test-data/projectData";
import { urls } from "@/utils/urls";
import { APIRequestContext, expect } from "@playwright/test";

export async function fetchAllProjectCount(request: APIRequestContext, token: string): Promise<any[]> {

  let page = 1;
  let allItems: any[] = [];
  let total = Infinity;
  let pageSize = 0;

  while (allItems.length < total) {
    const res = await request.post(
      urls.casting_base + `projects/search?page=${page}`,
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
    if (items.length === 0) break;
    if (allItems.length >= total) break;

    page++;
  }

  console.log("FINAL TOTAL:", allItems.length);
  return allItems;
}


export async function getPublishedProjects(request: APIRequestContext, token: string): Promise<{ count: number; names: string[] }> {

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

  const published = all.filter(p => p.is_published === true);

  const names = published.map(p => p.title);
  const count = published.length;

  console.log("Published count:", count);
  console.log("Published names:", names);

  return { count, names };
}


export async function createProject(request: APIRequestContext, token: string): Promise<{ response: any; payload: any }> {

  const payload = getProjectPayload();

  const res = await request.post(
    urls.casting_base + "projects/",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: payload
    }
  );

  expect(res.status()).toBe(201);

  const body = await res.json();

  return {
    response: body,
    payload: payload
  };
}


export async function publishProject(request: APIRequestContext, token: string, projectId: number): Promise<any> {

  const res = await request.patch(
    urls.casting_base + `projects/${projectId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: {
        is_published: 1
      }
    }
  );

  console.log("PATCH URL:", urls.casting_base + `projects/${projectId}`);
  console.log("Status:", res.status());

  expect(res.status()).toBe(201);

  return await res.json();
}


export async function deleteProject(request: APIRequestContext, token: string, projectId: number): Promise<void> {

  const res = await request.delete(
    urls.casting_base + `projects/${projectId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  console.log("Delete Project Status:", res.status());
  expect([200]).toContain(res.status());
}