import { Users } from "../../models/user.model";
import { CustomError } from "../../utils/custom-error";
import { createUniqueUsername } from "../../utils/helper";
import { createUser, findById, haveUsers, updateUser } from "./user.repo";

//Exported functions
export async function registerService(payload: any) {
    const auth0Id = payload.auth?.payload?.sub;
    const usersExist = await haveUsers();
    const user = await findById(auth0Id);

    if(payload?.body?.email) {
        var email = payload.body.email;
    }

    console.log(payload.auth);

    // If user already exists, return the existing user
    if (user) {
        return { user };
    }

    // Create a unique username
    let userName = await createUniqueUsername(email);

    const created = await createUser({
        auth0Id: auth0Id,        
        user_name: userName,
        display_name: userName,
        email: email,
        bio: null,
        is_admin: usersExist ? false : true
    } as any);

    if (!created) throw new CustomError('Failed to create user', 500);

    return { user: created };
}

export async function updateUserService(auth0Id: string, patch: Partial<Users>) {
    // Business logic can be added here if needed
    return await updateUser(auth0Id, patch);
}