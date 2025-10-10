import { CustomError } from '../../utils/custom-error';
import { createInvite, findInviteByEmail } from './invite.repo';

export async function generateInviteService(email: string) {
    const invite = await findInviteByEmail(email);
    if (invite) throw new CustomError('Invite already exists for email', 409);

    const created = await createInvite(email);
    if (!created) throw new CustomError('Could not create invite', 500);

    return { message: 'Invite sent successfully', invite: created };
}
