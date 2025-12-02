
import nodemailer from 'nodemailer';
import { ENV } from '../../config/env.config.js';

export class EmailProvider {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    // If transport config is not provided, we allow the app to start but warn
    if (!ENV.SMTP_HOST || !ENV.SMTP_USER || !ENV.SMTP_PASSWORD) {
      console.warn('⚠️ SMTP is not fully configured. Email sending will be disabled.');
      this.transporter = null;
      return;
    }

    // 1. Configuramos el "transporter" de Nodemailer
    this.transporter = nodemailer.createTransport({
      host: ENV.SMTP_HOST,
      port: ENV.SMTP_PORT,
      secure: ENV.SMTP_SECURE, // false para puerto 587 (STARTTLS)
      auth: {
        user: ENV.SMTP_USER,
        pass: ENV.SMTP_PASSWORD,
      },
    });
    // Optional verification on startup. This avoids timeouts on platforms that block SMTP.
    if (ENV.SMTP_VERIFY_ON_START) {
      // call verify with a catch so it doesn't crash the server
      this.verifyConnection().catch((err) => {
        console.error('Error verifying SMTP connection (startup):', err?.message || err);
      });
    }
    console.log(`✅ SMTP transporter initialized for ${ENV.SMTP_HOST}:${ENV.SMTP_PORT} secure=${ENV.SMTP_SECURE} verifyOnStart=${ENV.SMTP_VERIFY_ON_START}`);
  }

  // 2. Verificamos la conexión al iniciar
  private async verifyConnection() {
    try {
      if (this.transporter) {
        // We call verify but protect against long wait; Nodemailer has internal timeouts but
        // we'll still catch them and only log errors.
        await this.transporter.verify();
        console.log('📧 SMTP ready to send emails.');
      }
    } catch (error) {
      console.error('Error al verificar conexión SMTP:', (error as Error).message || error);
      throw error;
    }
  }

  // 3. Método para enviar el correo
  public async send(to: string, subject: string, htmlBody: string) {
    if (!this.transporter) {
      const msg = 'El transportador de email no está inicializado. Revisa SMTP_HOST/SMTP_USER/SMTP_PASSWORD';
      console.warn(msg);
      throw new Error(msg);
    }
    try {
      const mailOptions = {
        from: `"Servineo" <${ENV.SMTP_FROM}>`, 
        to: to,
        subject: subject,
        html: htmlBody,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Correo enviado. Message ID:', info.messageId);
      return info;

    } catch (error) {
      console.error('❌ Error al enviar el correo:', error);
      throw error; // Propagar el error original para mejor debugging
    }
  }

  // Helper to know if email sending is configured/enabled
  public isEnabled() {
    return !!this.transporter;
  }
}
