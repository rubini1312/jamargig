import { urls } from "@/utils/urls";
import { APIRequestContext } from "playwright";

type TeamUser = {
    uuid: string;
    email: string;
};

export async function getUserUuidByEmail(
    request: APIRequestContext,
    token: string,
    targetEmail: string
): Promise<string> {

    for (let i = 0; i < 10; i++) {

        const res = await request.get(
            urls.casting_base + "team/",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const body = await res.json();

        console.log(JSON.stringify(body, null, 2));

        const users = body.data || [];

        const user = users.find(
            (u: any) =>
                u.email?.toLowerCase() === targetEmail.toLowerCase()
        );

        if (user) {
            return user.user_uuid;
        }

        await new Promise(r => setTimeout(r, 2000));
    }

    throw new Error(`User not found: ${targetEmail}`);
}

export async function removeTeamMember(
    request: APIRequestContext,
    token: string,
    memberUuid: string,
    email: string
) {
    const url = urls.casting_base + `team/${memberUuid}/action`;
    console.log(url);
    console.log(email);

    const res = await request.patch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        data: {
            email: email,
            status_id: 0,
            action: "remove"
        }
    });

    console.log("Remove Member Status:", res.status());

    if (!res.ok()) {
        throw new Error(
            `Failed to remove member: ${res.status()} ${await res.text()}`
        );
    }

    const json = await res.json();
    return json;
}