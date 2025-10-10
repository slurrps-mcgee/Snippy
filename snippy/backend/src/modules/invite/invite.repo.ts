import { Invite } from '../../models/invite.model';

export async function createInvite(email: string) {
    return await Invite.create({ email, used: false, used_at: null } as any);
}

export async function findInviteByEmail(email: string) {
    return await Invite.findOne({ where: { email } });
}

export async function findInviteByCode(code: string) {
    return await Invite.findOne({ where: { code, used: false } });
}

export async function markInviteUsed(email: string, code: string, options: any = {}) {
    const [updatedCount] = await Invite.update(
        { used: true, used_at: new Date() },
        { where: { email, code, used: false }, ...options }
    );

    return updatedCount > 0;
}