import { urls } from "@/utils/urls";
import { APIRequestContext } from "playwright";
import { expect } from "playwright/test";

const uniqueName = `test-question-${Date.now()}`;


export async function createTextQuestion(
  request: APIRequestContext,
  token: string,
  projectId: number,
  roundId: number,
  roleId: number,
  question: string
) {

  const res = await request.post(
    urls.casting_base + `projects/${projectId}/questions`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: {
        question,
        description: "",
        field_type_id: 1,
        options: [],
        media_type: [],
        active_status: 1,
        rounds: [roundId],
        roles: [roleId]
      }
    }
  );

  console.log("Text Question Status:", res.status());
  expect([200, 201]).toContain(res.status());

  return await res.json();
}

export async function createCheckboxQuestion(
  request: APIRequestContext,
  token: string,
  projectId: number,
  roundId: number,
  roleId: number,
  question: string,
  options: string[]
) {

  const formattedOptions = options.map(o => ({ name: o }));

  const res = await request.post(
    urls.casting_base + `projects/${projectId}/questions`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: {
        question,
        description: "",
        field_type_id: 2,
        options: formattedOptions,
        media_type: [],
        active_status: 1,
        rounds: [roundId],
        roles: [roleId]
      }
    }
  );

  console.log("Checkbox Question Status:", res.status());
  console.log(await res.text());

  expect([200, 201]).toContain(res.status());

  return await res.json();
}

export async function createRadioQuestion(
  request: APIRequestContext,
  token: string,
  projectId: number,
  roundId: number,
  roleId: number,
  question: string,
  options: string[]
) {

  const formattedOptions = options.map(o => ({ name: o }));

  const res = await request.post(
    urls.casting_base + `projects/${projectId}/questions`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: {
        question,
        description: "",
        field_type_id: 3,
        options: formattedOptions,
        media_type: [],
        active_status: 1,
        rounds: [roundId],
        roles: [roleId]
      }
    }
  );

  console.log("Radio Question Status:", res.status());
  console.log(await res.text());

  expect([200, 201]).toContain(res.status());

  return await res.json();
}

export async function createDropdownQuestion(
  request: APIRequestContext,
  token: string,
  projectId: number,
  roundId: number,
  roleId: number,
  question: string,
  options: string[]
) {

  const formattedOptions = options.map(o => ({ name: o }));

  const res = await request.post(
    urls.casting_base + `projects/${projectId}/questions`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: {
        question,
        description: "",
        field_type_id: 4,
        options: formattedOptions,
        media_type: [],
        active_status: 1,
        rounds: [roundId],
        roles: [roleId]
      }
    }
  );

  console.log("Dropdown Question Status:", res.status());
  console.log(await res.text());

  expect([200, 201]).toContain(res.status());

  return await res.json();
}

export async function createMediaQuestion(
  request: APIRequestContext,
  token: string,
  projectId: number,
  roundId: number,
  roleId: number,
  question: string,
  mediaTypes: number[]
) {

  const res = await request.post(
    urls.casting_base + `projects/${projectId}/questions`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: {
        question,
        description: "",
        field_type_id: 5,
        options: [],
        media_type: mediaTypes,
        active_status: 1,
        rounds: [roundId],
        roles: [roleId]
      }
    }
  );

  console.log("Media Question Status:", res.status());
  console.log(await res.text());

  expect([200, 201]).toContain(res.status());

  return await res.json();
}


export async function createAvailabilityQuestion(
  request: APIRequestContext,
  token: string,
  projectId: number,
  roundId: number,
  roleId: number,
  question: string,
  options: string[]
) {

  const formattedOptions = options.map(o => ({ name: o }));

  const res = await request.post(
    urls.casting_base + `projects/${projectId}/questions`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: {
        question,
        description: "",
        field_type_id: 7,
        options: formattedOptions,
        media_type: [],
        active_status: 1,
        rounds: [roundId],
        roles: [roleId]
      }
    }
  );

  console.log("Availability Question Status:", res.status());
  console.log(await res.text());

  expect([200, 201]).toContain(res.status());

  return await res.json();
}

export async function updateQuestionAsInactive(
  request: APIRequestContext,
  token: string,
  projectId: number,
  questionId: number,
  payload: any
) {

  const res = await request.patch(
    urls.casting_base + `projects/${projectId}/questions/${questionId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: payload
    }
  );

  expect([200, 201]).toContain(res.status());

  return await res.json();
}


export async function makeTextQuestionAsMandory(
  request: APIRequestContext,
  token: string,
  projectId: number,
  roundId: number,
  roleId: number,
  question: string,
  questionId: number
) {

  const res = await request.patch(
    urls.casting_base + `projects/${projectId}/questions/${questionId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: {
        question,
        description: "",
        field_type_id: 1,
        options: [],
        media_type: [],
        active_status: 1,
        mandatory: 1,
        rounds: [roundId],
        roles: [roleId]
      }
    }
  );

  console.log("Text Question Status:", res.status());
  expect([200, 201]).toContain(res.status());

  return await res.json();
}

export async function makeCheckboxQuestionAsMandotory(
  request: APIRequestContext,
  token: string,
  projectId: number,
  roundId: number,
  roleId: number,
  question: string,
  options: string[],
  questionId: number
) {

  const formattedOptions = options.map(o => ({ name: o }));

  const res = await request.patch(
    urls.casting_base + `projects/${projectId}/questions/${questionId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: {
        question,
        description: "",
        field_type_id: 2,
        options: formattedOptions,
        media_type: [],
        active_status: 1,
        mandatory: 1,
        rounds: [roundId],
        roles: [roleId]
      }
    }
  );

  console.log("Checkbox Question Status:", res.status());
  console.log(await res.text());

  expect([200, 201]).toContain(res.status());

  return await res.json();
}

export async function makeRadioQuestionAsMandotory(
  request: APIRequestContext,
  token: string,
  projectId: number,
  roundId: number,
  roleId: number,
  question: string,
  options: string[],
  questionId: number
) {

  const formattedOptions = options.map(o => ({ name: o }));

  const res = await request.patch(
    urls.casting_base + `projects/${projectId}/questions/${questionId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: {
        question,
        description: "",
        field_type_id: 3,
        options: formattedOptions,
        media_type: [],
        active_status: 1,
        mandatory: 1,
        rounds: [roundId],
        roles: [roleId]
      }
    }
  );

  console.log("Radio Question Status:", res.status());
  console.log(await res.text());

  expect([200, 201]).toContain(res.status());

  return await res.json();
}

export async function makeDropdownQuestionAsMandotory(
  request: APIRequestContext,
  token: string,
  projectId: number,
  roundId: number,
  roleId: number,
  question: string,
  options: string[],
  questionId: number
) {

  const formattedOptions = options.map(o => ({ name: o }));

  const res = await request.patch(
    urls.casting_base + `projects/${projectId}/questions/${questionId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: {
        question,
        description: "",
        field_type_id: 4,
        options: formattedOptions,
        media_type: [],
        active_status: 1,
        mandatory: 1,
        rounds: [roundId],
        roles: [roleId]
      }
    }
  );

  console.log("Dropdown Question Status:", res.status());
  console.log(await res.text());

  expect([200, 201]).toContain(res.status());

  return await res.json();
}

export async function makeMediaQuestionAsMandotory(
  request: APIRequestContext,
  token: string,
  projectId: number,
  roundId: number,
  roleId: number,
  question: string,
  mediaTypes: number[],
  questionId: number
) {

  const res = await request.patch(
    urls.casting_base + `projects/${projectId}/questions/${questionId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: {
        question,
        description: "",
        field_type_id: 5,
        options: [],
        media_type: mediaTypes,
        active_status: 1,
        mandatory: 1,
        rounds: [roundId],
        roles: [roleId]
      }
    }
  );

  console.log("Media Question Status:", res.status());
  console.log(await res.text());

  expect([200, 201]).toContain(res.status());

  return await res.json();
}

export async function makeAvailabilityQuestionAsMandotory(
  request: APIRequestContext,
  token: string,
  projectId: number,
  roundId: number,
  roleId: number,
  question: string,
  options: string[],
  questionId: number
) {

  const formattedOptions = options.map(o => ({ name: o }));

  const res = await request.patch(
    urls.casting_base + `projects/${projectId}/questions/${questionId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: {
        question,
        description: "",
        field_type_id: 7,
        options: formattedOptions,
        media_type: [],
        active_status: 1,
        mandatory: 1,
        rounds: [roundId],
        roles: [roleId]
      }
    }
  );

  console.log("Availability Question Status:", res.status());
  console.log(await res.text());

  expect([200, 201]).toContain(res.status());

  return await res.json();
}

export async function makeTextQuestionAsInactive(
  request: APIRequestContext,
  token: string,
  projectId: number,
  roundId: number,
  roleId: number,
  question: string,
  questionId: number
) {

  const res = await request.patch(
    urls.casting_base + `projects/${projectId}/questions/${questionId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: {
        question,
        description: "",
        field_type_id: 1,
        options: [],
        media_type: [],
        active_status: 0,
        mandatory: 1,
        rounds: [roundId],
        roles: [roleId]
      }
    }
  );

  console.log("Text Question Status:", res.status());
  expect([200, 201]).toContain(res.status());

  return await res.json();
}

export async function makeCheckboxQuestionAsInactive(
  request: APIRequestContext,
  token: string,
  projectId: number,
  roundId: number,
  roleId: number,
  question: string,
  options: string[],
  questionId: number
) {

  const formattedOptions = options.map(o => ({ name: o }));

  const res = await request.patch(
    urls.casting_base + `projects/${projectId}/questions/${questionId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: {
        question,
        description: "",
        field_type_id: 2,
        options: formattedOptions,
        media_type: [],
        active_status: 0,
        mandatory: 1,
        rounds: [roundId],
        roles: [roleId]
      }
    }
  );

  console.log("Checkbox Question Status:", res.status());
  console.log(await res.text());

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
