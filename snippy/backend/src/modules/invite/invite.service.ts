import { CustomError } from '../../utils/custom-error';
import { createInvite } from './invite.repo';
import { findByEmail } from '../user/user.repo';

export const generateInviteService = async (email: string) => {
    const user = await findByEmail(email);
    if (user) throw new CustomError('Invite already exists', 409);

    const created = await createInvite(email);
    if (!created) throw new CustomError('Could not create invite', 500);

    // TODO: enqueue/send email with invite code
    return { message: 'Invite sent successfully', invite: created };
};