//generate random emails 
export function generateEmail(prefix: string = "qa"): string {
  const randomEmail =  `${prefix}_${Date.now()}@mail.test`;
  return randomEmail;
}

//generate random phone numbers 
export function generatePhone(prefix: string = "94"): string {
  const random = Math.floor(100000000 + Math.random() * 900000000);
  return `+${prefix}${random}`;
}

