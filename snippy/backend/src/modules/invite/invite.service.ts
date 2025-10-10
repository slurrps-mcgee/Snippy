import { CustomError } from '../../utils/custom-error';
import sendInviteEmail from '../../utils/email';
import { createInvite, findInviteByEmail } from './invite.repo';

export async function generateInviteService(email: string,  origin: string) {
    const invite = await findInviteByEmail(email);
    if (invite) throw new CustomError('Invite already exists for email', 409);

    const created = await createInvite(email);
    if (!created) throw new CustomError('Could not create invite', 500);

    sendInviteEmail(email, created.code, origin).catch((err) => {
            console.error('Error sending invite email:', err);
        });

    return { message: 'Invite sent successfully'};
}
