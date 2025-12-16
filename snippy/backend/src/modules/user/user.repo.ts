import { Transaction } from 'sequelize';
import { Users } from '../../entities/user.entity';

// #region User CRUD
export async function createUser(
	userData: Partial<Users>,
	transaction?: Transaction): Promise<Users> {
	const created = await Users.create(userData as any, { transaction });
	return created;
}

// Update existing user
export async function updateUser(
	auth0Id: string, 
	patch: Partial<Users>,
	transaction?: Transaction): Promise<boolean> {
	const updated = await Users.update(patch, { where: { auth0Id: auth0Id }, transaction });
	return updated[0] > 0;
}

export async function deleteUser(
	auth0Id: string,
	transaction?: Transaction): Promise<boolean> {
	const deleted = await Users.destroy({ where: { auth0Id: auth0Id }, transaction });
	return deleted > 0;
}
// #endregion

// #region User FIND
// Find user by Auth0 ID
export async function findById(
	id: string,
	transaction?: Transaction): Promise<Users | null> {
	return await Users.findByPk(id, { transaction });
}

// Find user by username 
export async function findByUsername(
	userName: string,
	transaction?: Transaction): Promise<Users | null> {
 	return await Users.findOne({ 
		where: { userName },
		transaction
	});
}
// #endregion

// Check if any users exist
export async function haveUsers(transaction?: Transaction): Promise<boolean> {
	const count = await Users.count({ transaction });
	return count > 0;
}