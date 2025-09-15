import e from "express";
import InviteRepo from "./invite.repo";

export const generateInviteService = async (email: string) => {
    const result = await InviteRepo.generateInvite(email);
    if (!result) {
        throw new Error('Invite cannot be sent. User already exists');
    }

    //email invite code to email use email service

    return { message: 'Invite sent successfully' };
};

export const validateInviteService = async (code: string) => {
    const result = await InviteRepo.validateInvite(code);
    
    if (!result) {
        throw new Error('Invalid invite token');
    }

    return { message: 'Invite is valid' };
}

export const markInviteUsedService = async (email: string, code: string) => {
    const result = await InviteRepo.markInviteUsed(email, code);
    
    if (!result) {
        throw new Error('Error marking invite as used');
    }

    return { message: 'Invite marked as used' };
}