import { Users } from '../../entities/user.entity';

// #region User CRUD
export async function createUser(
	userData: Partial<Users>): Promise<Users> {
	const created = await Users.create(userData as any);
	return created;
}

// Update existing user
export async function updateUser(
	auth0Id: string, 
	patch: Partial<Users>): Promise<boolean> {
	const updated = await Users.update(patch, { where: { auth0Id: auth0Id } });
	return updated[0] > 0;
}

export async function deleteUser(auth0Id: string): Promise<boolean> {
	const deleted = await Users.destroy({ where: { auth0Id: auth0Id } });
	return deleted > 0;
}
// #endregion

// #region User FIND
// Find user by Auth0 ID
export async function findById(id: string): Promise<Users | null> {
	return await Users.findByPk(id);
}

// Find user by username 
export async function findByUsername(userName: string): Promise<Users | null> {
 	return await Users.findOne({ 
		where: { userName }});
}
// #endregion

// Check if any users exist
export async function haveUsers(): Promise<boolean> {
	const count = await Users.count();
	return count > 0;
}