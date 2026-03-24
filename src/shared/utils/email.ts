/**
 * @module shared
 * @file email.ts
 * @description Email sending abstraction using Resend.
 */

import { Resend } from 'resend'
import { env } from '../config/env'

export interface IEmailService {
  sendVerificationEmail(to: string, token: string): Promise<void>
  sendPasswordResetEmail(to: string, token: string): Promise<void>
}

export class ResendEmailService implements IEmailService {
  private resend: Resend

  constructor() {
    this.resend = new Resend(env.RESEND_API_KEY)
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const url = `${env.FRONTEND_URL}/verificar-email?token=${token}`

    await this.resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: 'Confirme seu e-mail — PetHUB',
      html: `
        <h2>Bem-vindo ao PetHUB!</h2>
        <p>Clique no link abaixo para confirmar seu e-mail. O link expira em 24 horas.</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">Confirmar e-mail</a>
        <p>Ou copie e cole este link no navegador:<br/>${url}</p>
        <p>Se você não criou uma conta no PetHUB, ignore este e-mail.</p>
      `,
    })
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const url = `${env.FRONTEND_URL}/redefinir-senha?token=${token}`

    await this.resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: 'Redefinição de senha — PetHUB',
      html: `
        <h2>Redefinição de senha</h2>
        <p>Clique no link abaixo para redefinir sua senha. O link expira em 1 hora.</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">Redefinir senha</a>
        <p>Ou copie e cole este link no navegador:<br/>${url}</p>
        <p>Se você não solicitou a redefinição, ignore este e-mail.</p>
      `,
    })
  }
}
