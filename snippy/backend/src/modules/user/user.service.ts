import { Users } from "../../models/user.model";
import { CustomError } from "../../utils/custom-error";
import { createUniqueUsername } from "../../utils/helper";
import { createUser, findByEmail, haveUsers, updateUser } from "./user.repo";

//Exported functions
export async function registerService(payload: any) {
    const auth0Id = payload.auth?.payload?.sub;
    const { email } = payload.body;
    const usersExist = await haveUsers();
    const existingEmail = await findByEmail(email);
    const userNameBase = (email.split('@')[0] || '').replace(/\s+/g, '').toLowerCase();

    console.log(auth0Id);

    if (existingEmail) throw new CustomError('Email already in use', 409);

    let finalUserName = await createUniqueUsername(userNameBase);

    const created = await createUser({
        auth0Id: auth0Id,
        email: email,
        user_name: finalUserName,
        is_admin: usersExist ? false : true
    } as any);

    if (!created) throw new CustomError('Failed to create user', 500);

    return { user: created };
}

export async function updateUserService(id: string, patch: Partial<Users>) {
    // Business logic can be added here if needed
    return await updateUser(id, patch);
}