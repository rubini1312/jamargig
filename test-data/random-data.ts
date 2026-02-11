//generate random emails 
export function generateEmail(prefix: string = "qa"): string {
  const randomEmail =  `${prefix}_${Date.now()}@mail.test`;
  return randomEmail;
}

