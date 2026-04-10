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

    const res = await request.get(
        urls.casting_base + "team/",
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    if (!res.ok()) {
        throw new Error(`Failed to fetch team: ${res.status()} ${await res.text()}`);
    }

    const body = await res.json();

    const users: TeamUser[] = body.data || [];

    const user = users.find(u =>
        u.email.toLowerCase() === targetEmail.toLowerCase()
    );

    if (!user) {
        throw new Error(`User not found for email: ${targetEmail}`);
    }

    return user.uuid;
}

export async function removeTeamMember(
    request: APIRequestContext,
    token: string,
    memberUuid: string,
    email: string
) {
    const url = urls.casting_base + `team/${memberUuid}/action`;

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