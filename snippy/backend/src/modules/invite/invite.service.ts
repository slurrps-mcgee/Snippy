import InviteRepo from "./invite.repo";
import { CustomError } from "../../utils/custom-error";

/**
 * Generate an invite for a given email
 */
export const generateInviteService = async (email: string) => {
    const success = await InviteRepo.generateInvite(email);

    if (!success) {
        throw new CustomError('User already exists or invite could not be created', 409);
    }

    // TODO: send email invite here with code
    return { message: 'Invite sent successfully' };
};

/**
 * Validate an invite token
 */
export const validateInviteService = async (code: string) => {
    const invite = await InviteRepo.validateInvite(code);

    if (!invite) {
        throw new CustomError('Invalid or expired invite token', 400);
    }

    return { message: 'Invite is valid', invite };
};

/**
 * Mark an invite as used
 */
export const markInviteUsedService = async (email: string, code: string) => {
    const success = await InviteRepo.markInviteUsed(email, code);

    if (!success) {
        throw new CustomError('Invite not found or already used', 409);
    }

    return { message: 'Invite marked as used' };
};
