import { talentProfileData } from "@/test-data/talentProfileData";
import { updateTalentRegistration } from "../api/casting/talentApi";
import { APIRequestContext } from "playwright";

export async function completeTalentRegistration(
  request: APIRequestContext,
  token: string
) {

  // Basic profile
  await updateTalentRegistration(
    request,
    token,
    talentProfileData.step1_basicProfile
  );

  // Avatar
  await updateTalentRegistration(
    request,
    token,
    talentProfileData.step2_avatar
  );

  // Profile info
  await updateTalentRegistration(
    request,
    token,
    talentProfileData.step3_profileInfo
  );

  // Production types
  await updateTalentRegistration(
    request,
    token,
    talentProfileData.step4_productionTypes
  );

}