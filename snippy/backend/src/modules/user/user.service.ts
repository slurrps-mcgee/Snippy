import { Users } from "../../models/user.model";
import { updateUser } from "./user.repo";

export const updateUserService = async (id: string, patch: Partial<Users>) => {
    // Business logic can be added here if needed
    return await updateUser(id, patch);
}