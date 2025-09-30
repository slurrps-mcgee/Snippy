import nodemailer from 'nodemailer';

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
    inviterName?: string
): Promise<SendInviteResult> => {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.EMAIL_FROM || `no-reply@${process.env.FRONTEND_ORIGIN || 'example.com'}`;
    const secure = (process.env.EMAIL_SECURE || 'false').toLowerCase() === 'true';

    if (!host || !port || !user || !pass) {
        // Graceful fallback: log the invite and return success=false
        console.warn('SMTP not configured; invite email not sent. Invite code:', inviteCode, 'to:', to);
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

    const subject = `${inviterName ? inviterName + ' invited you to Snippy' : 'You were invited to Snippy'}`;
    const text = `You've been invited to join Snippy.

Use this invite code to register: ${inviteCode}

Visit: ${process.env.FRONTEND_ORIGIN || 'http://localhost:4200'} to sign up.`;

    const html = `<p>You've been invited to join <strong>Snippy</strong>.</p>
<p>Use this invite code to register: <strong>${inviteCode}</strong></p>
<p>Visit <a href="snippy.slurrpsservers.com">the site</a> to sign up.</p>`;

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
