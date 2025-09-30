import { createUser as createUserInRepo } from '../user/user.repo';

export const createUser = async (userData: Partial<any>, options: any = {}) => {
	return createUserInRepo(userData as any, options);
};