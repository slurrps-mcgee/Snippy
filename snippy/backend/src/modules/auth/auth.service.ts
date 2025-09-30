import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { CustomError } from '../../utils/custom-error';
import { findByEmail, createUser, haveUsers } from '../user/user.repo';
import { createUniqueUsername } from '../../utils/helper';
import { findInviteByCode, markInviteUsed } from '../invite/invite.repo';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const SALT_ROUNDS = 10;

//Exported functions
export const registerService = async (payload: any) => {
	const { email, password, inviteCode } = payload;

	const inviteOnly = (process.env.INVITE_ONLY || 'false').toLowerCase() === 'true';
	const usersExist = await haveUsers();
	const existingEmail = await findByEmail(email);
    const base = (email.split('@')[0] || '').replace(/\s+/g, '').toLowerCase();

	if (existingEmail) throw new CustomError('Email already in use', 409);

	// Derive base from email local part
    let finalUserName = await createUniqueUsername(base);

	if (inviteOnly && usersExist) {
        if (!inviteCode) throw new CustomError('Invite code is required for registration', 400);

		// Validate invite server-side
		const invite = await findInviteByCode(inviteCode);
		if (!invite) throw new CustomError('Invalid or expired invite token', 400);

		// Use transaction to create user and mark invite used atomically
		const sequelize = (await import('../../models/user.model')).Users.sequelize;
		if (!sequelize) throw new CustomError('DB not initialized', 500);

		const t = await sequelize.transaction();
		try {
			const salt = await bcrypt.genSalt(SALT_ROUNDS);
			const hashed = await bcrypt.hash(password, salt);

			const created = await createUser({
				email,
				user_name: finalUserName,
				password: hashed,
				salt,
                is_admin: usersExist ? false : true
			} as any, { transaction: t });

            if (!created) throw new CustomError('Failed to create user', 500);

			// mark invite used - ensure it wasn't already used by checking affected rows
			const marked = await markInviteUsed(invite.email, invite.code, { transaction: t });
			if (!marked) {
				throw new CustomError('Invite already used or invalid', 409);
			}

			await t.commit();

			const user = sanitizeUser(created);
			const token = jwt.sign({ sub: created.userId, email: created.email }, JWT_SECRET, { expiresIn: '7d' });

			return { user, token };
		} catch (err) {
			await t.rollback();
			throw err;
		}
	} else {
		// Open registration (no invite required)
		const salt = await bcrypt.genSalt(SALT_ROUNDS);
		const hashed = await bcrypt.hash(password, salt);

		const created = await createUser({
			email,
			user_name: finalUserName,
			password: hashed,
			salt,
            is_admin: usersExist ? false : true
		} as any);

        console.log('Created user:', created);

		if (!created) throw new CustomError('Failed to create user', 500);

		const user = sanitizeUser(created);
		const token = jwt.sign({ sub: created.userId, email: created.email }, JWT_SECRET, { expiresIn: '7d' });

		return { user, token };
	}
};

export const loginService = async (payload: any) => {
	const { email, password } = payload;
	const user = await findByEmail(email);
	if (!user) throw new CustomError('Invalid credentials', 401);

	const match = await bcrypt.compare(password, user.password);
	if (!match) throw new CustomError('Invalid credentials', 401);

	const sanitized = sanitizeUser(user);
	const token = jwt.sign({ sub: user.userId, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

	return { user: sanitized, token };
};

const sanitizeUser = (user: any) => {
	if (!user) return null;
	const u = user.toJSON ? user.toJSON() : { ...user };
	delete u.password;
	delete u.salt;
	return u;
};