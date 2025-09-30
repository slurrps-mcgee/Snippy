import { Users } from '../../models/user.model';

export const haveUsers = async () => {
    const count = await Users.count();
    return count > 0;
}

export const findByEmail = async (email: string) => {
	return Users.findOne({ where: { email } });
};

export const findByUsername = async (user_name: string) => {
	return Users.findOne({ where: { user_name } });
};

export const findByDisplayName = async (display_name: string) => {
	return Users.findOne({ where: { display_name } });
};

export const findById = async (id: string) => {
	return Users.findByPk(id);
};

export const updateUser = async (id: string, patch: Partial<Users>) => {
	const [count] = await Users.update(patch, { where: { userId: id } });
	return count > 0;
};

export const createUser = async (userData: Partial<Users>, options: any = {}) => {
	// options may contain { transaction }
	return Users.create(userData as any, options);
};
