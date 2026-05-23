import nodemailer from 'nodemailer';

const enabled = process.env.ALERT_EMAIL_ENABLED === 'true';
const cooldownMs = Number(process.env.ALERT_COOLDOWN_MS || 5 * 60 * 1000);
const lastAlertByKey = new Map();

let transporter;

const getTransporter = () => {
    if (!enabled) return null;

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.ADMIN_ALERT_EMAIL) {
        console.warn('[monitoring] Email alert is enabled but SMTP_USER, SMTP_PASS, or ADMIN_ALERT_EMAIL is missing.');
        return null;
    }

    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    return transporter;
};

const shouldSendAlert = (key) => {
    const now = Date.now();
    const lastSent = lastAlertByKey.get(key) || 0;

    if (now - lastSent < cooldownMs) {
        return false;
    }

    lastAlertByKey.set(key, now);
    return true;
};

const renderAlertText = (payload) => {
    const lines = [
        'API Gateway detected an abnormal server error.',
        '',
        `Service: ${payload.service || 'api-gateway'}`,
        `Status: ${payload.status || 'unknown'}`,
        `Method: ${payload.method || 'unknown'}`,
        `Path: ${payload.path || 'unknown'}`,
        `Request ID: ${payload.requestId || 'unknown'}`,
        `IP: ${payload.ip || 'unknown'}`,
        `Time: ${payload.timestamp || new Date().toISOString()}`,
        '',
        `Message: ${payload.message || 'No message'}`,
    ];

    if (payload.stack) {
        lines.push('', 'Stack:', payload.stack);
    }

    return lines.join('\n');
};

export const sendAdminAlert = async (payload) => {
    const mailer = getTransporter();
    if (!mailer) return;

    const alertKey = `${payload.service || 'gateway'}:${payload.status || 'error'}:${payload.path || 'unknown'}`;
    if (!shouldSendAlert(alertKey)) return;

    try {
        await mailer.sendMail({
            from: process.env.ALERT_EMAIL_FROM || process.env.SMTP_USER,
            to: process.env.ADMIN_ALERT_EMAIL,
            subject: `[DoAn1 Alert] ${payload.service || 'API Gateway'} ${payload.status || 'error'} at ${payload.path || 'unknown path'}`,
            text: renderAlertText(payload),
        });
        console.info('[monitoring] Admin alert email sent.', {
            service: payload.service,
            path: payload.path,
            requestId: payload.requestId,
        });
    } catch (error) {
        console.error('[monitoring] Failed to send admin alert email.', {
            message: error.message,
            service: payload.service,
            path: payload.path,
            requestId: payload.requestId,
        });
    }
};
