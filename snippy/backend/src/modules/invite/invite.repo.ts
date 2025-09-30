import { Invites } from '../../models/invite.model';

export const createInvite = async (email: string) => {
    return Invites.create({ email, used: false, used_at: null } as any);
};

export const findInviteByCode = async (code: string) => {
    return Invites.findOne({ where: { code, used: false } });
};

export const markInviteUsed = async (email: string, code: string, options: any = {}) => {
    const [updatedCount] = await Invites.update(
        { used: true, used_at: new Date() },
        { where: { email, code, used: false }, ...options }
    );

    return updatedCount > 0;
};