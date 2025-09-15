import { Invites } from '../../models/invite.model';
import { Users } from '../../models/user.model';

class InviteRepo {
    static async generateInvite(email: string): Promise<boolean> {
        const user = await Users.findOne({ where: { email } });

        if (user) {
            // Repo shouldn't decide on conflict — let service handle this
            return false;
        }

        const result = await Invites.create({
            email,
            used: false,
            used_at: null,
        } as any);

        if (!result) {
            throw new Error('Failed to create invite record');
        }

        return true;
    }

    static async validateInvite(code: string): Promise<Invites | null> {
        const invite = await Invites.findOne({ where: { code, used: false } });

        if (!invite) {
            return null; // service decides whether it's "invalid" or "expired"
        }

        return invite;
    }

    static async markInviteUsed(email: string, code: string): Promise<boolean> {
        const [updatedCount] = await Invites.update(
            { used: true, used_at: new Date() },
            { where: { email, code, used: false } }
        );

        if (updatedCount === 0) {
            throw new Error('Failed to mark invite as used');
        }

        return true;
    }
}

export default InviteRepo;
