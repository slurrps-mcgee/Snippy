import nodemailer from 'nodemailer';
import logger from './logger';

/**
 * Send an invitation email containing an invite code.
 * Expects the following env vars to be set for SMTP transport:
 * SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
 */
export const sendInviteEmail = async (to: string, inviteCode: string, origin: string) => {
    const transporter = getTransporter(to, origin);
    const from = process.env.EMAIL_FROM || `no-reply@${origin}`;
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

export const sendPasswordResetEmail = async (to: string, origin: string) => {
    const transporter = getTransporter(to, origin);
    const from = process.env.EMAIL_FROM || `no-reply@${origin}`;
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

const getTransporter = (to: string, origin: string) => {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = (process.env.EMAIL_SECURE || 'false').toLowerCase() === 'true';

    if (!host || !port || !user || !pass) {
        logger.warn('SMTP not configured; failing to send email. Url:', origin, 'to:', to);
        return { success: false, error: 'SMTP not configured' } as any;
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: secure,
        auth: { user, pass },
        requireTLS: true,
        tls: {
            // do not fail on invalid certs
            rejectUnauthorized: false,
        },
    });

    return transporter;
}
