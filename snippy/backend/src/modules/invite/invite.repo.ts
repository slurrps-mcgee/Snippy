import { Invite } from '../../models/invite.model';

export const createInvite = async (email: string) => {
    return await Invite.create({ email, used: false, used_at: null } as any);
};

export const findInviteByCode = async (code: string) => {
    return await Invite.findOne({ where: { code, used: false } });
};

export const markInviteUsed = async (email: string, code: string, options: any = {}) => {
    const [updatedCount] = await Invite.update(
        { used: true, used_at: new Date() },
        { where: { email, code, used: false }, ...options }
    );

    return updatedCount > 0;
};