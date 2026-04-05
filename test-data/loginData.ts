import { generateEmail } from "./random-data";

export const validLogin = {
  email: "automation@example.com",
  password: "@ut0maT31234",
  tenant_id: "63e31adc898a4"
};

export const invalidPasswordLogin = {
  email: "automation@example.com",
  password: Math.random().toString(36).slice(2),
};


export const emptyLogin = {
  email: " ",
  password: " ",
};

export const invalidEmailLogin = {
  invalidformatemail: Math.random().toString(36).slice(2),
  unAuthorizedEmail: generateEmail()
};