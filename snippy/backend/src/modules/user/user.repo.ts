import { Users } from '../../models/user.model';

export async function haveUsers() {
	const count = await Users.count();
	return count > 0;
}

export async function findByEmail(email: string) {
	return await Users.findOne({ where: { email } });
}

export async function findByUsername(user_name: string) {
	return await Users.findOne({ where: { user_name } });
}

export async function findByDisplayName(display_name: string) {
	return await Users.findOne({ where: { display_name } });
}

export async function findById(id: string) {
	return await Users.findByPk(id);
}

export async function updateUser(auth0Id: string, patch: Partial<Users>) {
	const [count] = await Users.update(patch, { where: { auth0Id: auth0Id } });
	return count > 0;
}

export async function createUser(userData: Partial<Users>, options: any = {}) {
	// options may contain { transaction }
	return await Users.create(userData as any, options);
}