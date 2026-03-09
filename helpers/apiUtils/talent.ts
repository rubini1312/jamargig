import { talentProfileData } from "@/test-data/talentProfileData";
import { updateTalentRegistration } from "../api/talentApi";
import { APIRequestContext } from "playwright";

export async function completeTalentRegistration(
  request: APIRequestContext,
  token: string
) {

  // 1️⃣ Basic profile
  await updateTalentRegistration(
    request,
    token,
    talentProfileData.step1_basicProfile
  );

  // 2️⃣ Avatar
  await updateTalentRegistration(
    request,
    token,
    talentProfileData.step2_avatar
  );

  // 3️⃣ Profile info
  await updateTalentRegistration(
    request,
    token,
    talentProfileData.step3_profileInfo
  );

  // 4️⃣ Production types
  await updateTalentRegistration(
    request,
    token,
    talentProfileData.step4_productionTypes
  );

}