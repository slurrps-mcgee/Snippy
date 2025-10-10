import bcrypt from 'bcrypt';
import { CustomError } from '../../utils/custom-error';
import { findByEmail, createUser, haveUsers, updateUser, findById } from '../user/user.repo';
import { createUniqueUsername } from '../../utils/helper';
import { findInviteByCode, markInviteUsed } from '../invite/invite.repo';
import { createTokens, refreshTokens } from '../../middleware/jwt.service';
import { createPasswordReset, findPasswordResetByHash, deletePasswordResetById } from './auth.repo';
import { sendPasswordResetEmail } from '../../utils/email';
import crypto from 'crypto';

const SALT_ROUNDS = 10;

//Exported functions
export async function registerService(email: string, password: string, inviteCode?: string) {
	const inviteOnly = (process.env.INVITE_ONLY || 'false').toLowerCase() === 'true';
	const usersExist = await haveUsers();
	const existingEmail = await findByEmail(email);
    const userNameBase = (email.split('@')[0] || '').replace(/\s+/g, '').toLowerCase();

	if (existingEmail) throw new CustomError('Email already in use', 409);

    let finalUserName = await createUniqueUsername(userNameBase);

	if (inviteOnly && usersExist) {
        if (!inviteCode) throw new CustomError('Invite code is required for registration', 400);

		// Validate invite server-side
		const invite = await findInviteByCode(inviteCode);
		if (!invite) throw new CustomError('Invalid or expired invite token', 400);

        if(invite.email.toLowerCase() !== email.toLowerCase()) {
            throw new CustomError('Invite code does not match the provided email', 400);
        }

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

			const { accessToken, refreshToken } = createTokens({ sub: created.userId, email: created.email });

			return { user: created, accessToken, refreshToken };
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

		if (!created) throw new CustomError('Failed to create user', 500);

		const { accessToken, refreshToken } = createTokens({ sub: created.userId, email: created.email });

		return { user: created, accessToken, refreshToken };
	}
}

export async function loginService(email: string, password: string) {
	const user = await findByEmail(email);
	if (!user) throw new CustomError('Invalid credentials', 401);

	const match = await bcrypt.compare(password, (user as any).password);
	if (!match) throw new CustomError('Invalid credentials', 401);

	const { accessToken, refreshToken } = createTokens({ sub: user.userId, email: user.email });

	return { user, accessToken, refreshToken };
}

export async function refreshService(refreshToken: string) {
	return refreshTokens(refreshToken);
}

// Request a password reset: create token, email user with link containing raw token
export async function requestPasswordReset(email: string, origin: string) {
	const user = await findByEmail(email);
	// Always return success for the public API to avoid leaking whether email exists
	if (!user) return;

	const raw = crypto.randomBytes(32).toString('hex');
	const hash = crypto.createHash('sha256').update(raw).digest('hex');
	const expires = new Date(Date.now() + (process.env.PASSWORD_RESET_EXP_MIN ? parseInt(process.env.PASSWORD_RESET_EXP_MIN) * 60000 : 30 * 60 * 1000));

	const rec = await createPasswordReset({ userId: user.userId, token_hash: hash, expires_at: expires } as any);

	origin = `${origin.replace(/\/+$/, '')}/reset-password?token=${raw}`;
	// fire-and-forget email send; don't block user-facing response
	sendPasswordResetEmail(user.email, origin).catch((err) => {
		console.error('Failed to send password reset email', err);
	});

	return;
}

// Verify token and reset password. On success delete token record.
export async function resetPassword(rawToken: string, newPassword: string) {
	const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
	const record = await findPasswordResetByHash(hash);
	if (!record) throw new CustomError('Invalid or expired token', 400);
	if (record.expires_at < new Date()) throw new CustomError('Token expired', 400);

	const user = await findById(record.userId);
	if (!user) throw new CustomError('User not found', 404);

	const salt = await bcrypt.genSalt(SALT_ROUNDS);
	const hashed = await bcrypt.hash(newPassword, salt);

	// Update using repository helper (use userId primary key)
	const ok = await updateUser(user.userId, { password: hashed, salt } as any);

	if (!ok) throw new CustomError('Failed to update password', 500);

	// Delete the password reset record so it can't be reused
	await deletePasswordResetById(record.id);

	// Optionally: update password_changed_at on user or increment token version
	return;
}
