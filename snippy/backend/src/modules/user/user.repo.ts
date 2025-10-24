import { Users } from '../../models/user.model';
import { sanitizeUser } from '../../utils/helper';

export async function haveUsers() {
	const count = await Users.count();
	return count > 0;
}

export async function findByUsername(userName: string) {
 	const u = await Users.findOne({ where: { userName } });
 	return sanitizeUser(u);
}

export async function findByDisplayName(displayName: string) {
 	const u = await Users.findOne({ where: { displayName } });
 	return sanitizeUser(u);
}

export async function findById(id: string) {
	const u = await Users.findByPk(id);
	return sanitizeUser(u);
}

export async function updateUser(auth0Id: string, patch: Partial<Users>) {
	// Perform the update, then fetch and return the updated user as a
	// sanitized plain object. Different SQL dialects return different
	// shapes from `Users.update()`, so avoid relying on that.
	await Users.update(patch, { where: { auth0Id: auth0Id } });
	const u = await Users.findOne({ where: { auth0Id: auth0Id } });
	return sanitizeUser(u);
}

export async function createUser(userData: Partial<Users>) {
	const created = await Users.create(userData as any);
	return sanitizeUser(created);
}