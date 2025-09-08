import { Invites } from '../../models/invite.model';
import { Invite } from '../../interfaces/invite.interface';
import { Users } from '../../models/user.model';

class InviteRepo {
    static async generateInvite(email: string): Promise<boolean> {
        try {
            var user = await Users.findOne({ where: { email: email } });

            console.log(user);
            if (user)
                return false;

            // Insert a new invite using the Invites model
            const result = await Invites.create({
                email: email,
                used: false,
                used_at: null,
            } as any);

            return (result) ? true : false;
        } catch (error) { 
            console.error('Error generating invite:', error);
            return false;
        }
    }

    static async validateInvite(code: string): Promise<Invites | null> {
        try {
            const invite = await Invites.findOne({ where: { code:code, used: false } });

            return invite ? invite : null;
        } catch (error) {
            console.error('Error validating invite:', error);
            return null;
        }
    }

    static async markInviteUsed(email: string, code: string): Promise<boolean> {
        try {
            const result = await Invites.update(
                { used: true, used_at: new Date() },
                { where: { email: email, code: code } }
            );

            return (result[0] > 0) ? true : false;
        } catch (error) {
            console.error('Error marking invite as used:', error);
            return false;
        }
    }
}

export default InviteRepo;
