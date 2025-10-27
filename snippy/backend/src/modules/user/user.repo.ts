import { Users } from '../../models/user.model';

export async function haveUsers() {
	const count = await Users.count();
	return count > 0;
}

// Find user by Auth0 ID
export async function findById(id: string) {
	const user = await Users.findByPk(id);
	return sanitizeUser(user);
}

// Find user by username
export async function findByUsername(userName: string) {
 	const user = await Users.findOne({ where: { userName }});
 	return sanitizeUser(user);
}

// Find user by display name
export async function findByDisplayName(displayName: string) {
 	const user = await Users.findOne({ where: { displayName }});
 	return sanitizeUser(user);
}

// Create a new user
export async function createUser(userData: Partial<Users>) {
	const created = await Users.create(userData as any);
	return sanitizeUser(created);
}

// Update existing user
export async function updateUser(auth0Id: string, patch: Partial<Users>) {
	await Users.update(patch, { where: { auth0Id: auth0Id } });
	const user = await Users.findOne({ where: { auth0Id: auth0Id }});
	return sanitizeUser(user);
}


// Sanitize user object by removing sensitive/internal fields
function sanitizeUser(user: any) {
	if (!user) return null;

	// If this is a Sequelize instance, get a plain object copy
	let plain: any;
	try {
		if (typeof user.get === 'function') {
			plain = user.get({ plain: true });
		} else if (typeof user.toJSON === 'function') {
			plain = user.toJSON();
		} else {
			plain = { ...user };
		}
	} catch (e) {
		plain = { ...user };
	}

	user = plain;

	// Remove sensitive/internal fields	
	delete user.auth0Id;
	delete user.isAdmin;
	delete user.created_at;
	delete user.updated_at;

	return user;
}