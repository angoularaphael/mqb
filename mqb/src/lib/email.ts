import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'suzinabot@gmail.com',
    pass: process.env.EMAIL_PASS || '',
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'MQB System'}" <${process.env.EMAIL_FROM_EMAIL || 'suzinabot@gmail.com'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`✅ Email sent to ${options.to}`);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, code: string, userName: string) {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?code=${code}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
          .header { text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; }
          .content { padding: 20px 0; }
          .code-box { background: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; }
          .button { display: inline-block; background: #007bff; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin-top: 15px; }
          .footer { text-align: center; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Réinitialisation de mot de passe</h1>
          </div>
          <div class="content">
            <p>Bonjour ${userName},</p>
            <p>Vous avez demandé une réinitialisation de mot de passe pour votre compte MQB.</p>
            <p>Voici votre code de vérification (valide 10 minutes) :</p>
            <div class="code-box">${code}</div>
            <p>Ou cliquez sur le lien ci-dessous :</p>
            <a href="${resetLink}" class="button">Réinitialiser mon mot de passe</a>
            <p><strong>Important:</strong> Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
          </div>
          <div class="footer">
            <p>MQB - Système de Gestion Scolaire</p>
            <p>© 2024 Tous droits réservés</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Réinitialisation de votre mot de passe MQB',
    html,
  });
}

export async function sendBroadcastMessage(
  recipients: string[],
  subject: string,
  message: string,
  senderName: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
          .content { padding: 20px 0; line-height: 1.6; }
          .footer { text-align: center; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${subject}</h2>
          </div>
          <div class="content">
            <p>Message de ${senderName}:</p>
            <div>${message.replace(/\n/g, '<br>')}</div>
          </div>
          <div class="footer">
            <p>MQB - Plateforme de Communication</p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Send to all recipients
  for (const recipient of recipients) {
    await sendEmail({
      to: recipient,
      subject,
      html,
    });
  }
}

export async function sendNotificationEmail(email: string, subject: string, message: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
          .header { background: #667eea; color: white; padding: 15px; border-radius: 5px; }
          .content { padding: 20px 0; }
          .footer { text-align: center; border-top: 1px solid #eee; padding-top: 15px; font-size: 11px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h3>${subject}</h3>
          </div>
          <div class="content">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <div class="footer">
            <p>Notification MQB</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
  });
}
