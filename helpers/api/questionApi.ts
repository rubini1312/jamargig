import { urls } from "@/utils/urls";
import { APIRequestContext } from "playwright";
import { expect } from "playwright/test";

const uniqueName = `test-question-${Date.now()}`;

export async function createQuestion(
  request: APIRequestContext,
  token: string,
  projectId: number,
  roundId: number,
  roleId: number
): Promise<any> {

  const res = await request.post(
    urls.casting_base + `projects/${projectId}/questions`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: {
        options: [],
        active_status: 0,
        description: "",
        question: uniqueName,
        media_type: [],
        field_type_id: 1,
        rounds: [roundId],
        roles: [roleId]
      }
    }
  );

  console.log("Create Question Status:", res.status());
  expect(res.status()).toBe(201);

  return await res.json();
}

export async function activateQuestion(
  request: APIRequestContext,
  token: string,
  projectId: number,
  questionId: number,
  roleId: number,
  roundId: number
): Promise<any> {

  const res = await request.patch(
    urls.casting_base + `projects/${projectId}/questions/${questionId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: {
        question_id: questionId,
        question: uniqueName,
        description: "",
        mandatory: 0,
        client_access: 0,
        active_status: 1,
        media_type: [],
        is_checkin_question: false,
        field_type_id: 1,
        roles: [roleId],
        rounds: [roundId],
        options: []
      }
    }
  );

  console.log("Activate Question Status:", res.status());
  expect([200, 201]).toContain(res.status());

  return await res.json();
}


export async function deleteQuestion(
  request: APIRequestContext,
  token: string,
  projectId: number,
  questionId: number
): Promise<void> {

  const url = urls.casting_base + `projects/${projectId}/questions/${questionId}`;

  console.log("Delete Question URL:", url);

  const res = await request.delete(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  console.log("Delete Question Status:", res.status());
  console.log("Delete Question Response:", await res.text());

  expect(res.status()).toBe(201);
}


export async function getProjectQuestions(
  request: APIRequestContext,
  token: string,
  projectId: number
): Promise<any[]> {

  const res = await request.get(
    urls.casting_base + `projects/${projectId}/questions/`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  console.log("Get Questions Status:", res.status());
  expect(res.status()).toBe(200);

  return await res.json();
}


export async function deleteAllQuestions(
  request: APIRequestContext,
  token: string,
  projectId: number
): Promise<void> {

  const questions = await getProjectQuestions(request, token, projectId);

  for (const question of questions) {
    const questionId = question.question_id;

    console.log(`Deleting question ${questionId}`);

    await deleteQuestion(request, token, projectId, questionId);
  }
}

export async function getSubmittedForm(
  request: APIRequestContext,
  token: string,
  projectId: number,
  talentUuid: string
): Promise<any> {

  const res = await request.get(
    urls.casting_base + `projects/${projectId}/talent/${talentUuid}/submitted-form`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  console.log("Get Submitted Form Status:", res.status());

  expect(res.status()).toBe(200);

  return await res.json();
}
