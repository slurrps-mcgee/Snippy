import nodemailer from 'nodemailer';
import logger from './logger';

type SendInviteResult = {
    success: boolean;
    info?: any;
    error?: string;
};

/**
 * Send an invitation email containing an invite code.
 * Expects the following env vars to be set for SMTP transport:
 * SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
 */
export const sendInviteEmail = async (
    to: string,
    inviteCode: string,
    origin: string
): Promise<SendInviteResult> => {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.EMAIL_FROM || `no-reply@${origin}`;
    const secure = (process.env.EMAIL_SECURE || 'false').toLowerCase() === 'true';

    if (!host || !port || !user || !pass) {
        // Graceful fallback: log the invite and return success=false
        logger.warn('SMTP not configured; invite email not sent. Invite code:', inviteCode, 'to:', to);
        return { success: false, error: 'SMTP not configured' };
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: secure, // true for 465, false for other ports
        auth: {
            user,
            pass,
        },
    });

    const subject = 'You were invited to Snippy';
    const text = `You've been invited to join Snippy.
        Use this invite code to register: ${inviteCode}
        Visit: ${origin} to sign up.`;

    const html = `<p>You've been invited to join <strong>Snippy</strong>.</p>
        <p>Use this invite code to register: <strong>${inviteCode}</strong></p>
        <p>Visit <a href="${origin}">the site</a> to sign up.</p>`;

    try {
        const info = await transporter.sendMail({
            from,
            to,
            subject,
            text,
            html,
        });
        return { success: true, info };
    } catch (err: any) {
        console.error('Error sending invite email:', err);
        return { success: false, error: err?.message || String(err) };
    }
};

export default sendInviteEmail;

export const sendPasswordResetEmail = async (to: string, origin: string) => {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.EMAIL_FROM || `no-reply@${origin}`;
    const secure = (process.env.EMAIL_SECURE || 'false').toLowerCase() === 'true';

    if (!host || !port || !user || !pass) {
        logger.warn('SMTP not configured; password reset email not sent. Url:', origin, 'to:', to);
        return { success: false, error: 'SMTP not configured' } as any;
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: secure,
        auth: { user, pass }
    });

    const subject = 'Reset your Snippy password';
    const text = `Reset your password by visiting: ${origin}`;
    const html = `<p>Reset your password by clicking <a href="${origin}">this link</a>. This link will expire shortly.</p>`;

    try {
        const info = await transporter.sendMail({ from, to, subject, text, html });
        return { success: true, info };
    } catch (err: any) {
        console.error('Error sending password reset email:', err);
        return { success: false, error: err?.message || String(err) } as any;
    }
}
