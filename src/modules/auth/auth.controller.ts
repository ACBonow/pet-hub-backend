/**
 * @module auth
 * @file auth.controller.ts
 * @description HTTP handlers for auth endpoints. Validates with Zod, delegates logic to service.
 */

import type { FastifyReply, FastifyRequest } from 'fastify'
import {
  ForgotPasswordSchema,
  LoginSchema,
  RefreshSchema,
  RegisterSchema,
  ResendVerificationSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
} from './auth.schema'
import type { AuthService } from './auth.service'

export class AuthController {
  constructor(private service: AuthService) {}

  async register(request: FastifyRequest, reply: FastifyReply) {
    const parsed = RegisterSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: parsed.error.issues },
      })
    }
    const tokens = await this.service.register(parsed.data)
    return reply.status(201).send({ success: true, data: tokens })
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const parsed = LoginSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: parsed.error.issues },
      })
    }
    const tokens = await this.service.login(parsed.data)
    return reply.status(200).send({ success: true, data: tokens })
  }

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    const parsed = RefreshSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: parsed.error.issues },
      })
    }
    const result = await this.service.refresh(parsed.data)
    return reply.status(200).send({ success: true, data: result })
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    await this.service.logout(request.user!.id)
    return reply.status(204).send()
  }

  async verifyEmail(request: FastifyRequest, reply: FastifyReply) {
    const parsed = VerifyEmailSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: parsed.error.issues },
      })
    }
    await this.service.verifyEmail(parsed.data)
    return reply.status(200).send({ success: true, data: { message: 'E-mail verificado com sucesso.' } })
  }

  async resendVerification(request: FastifyRequest, reply: FastifyReply) {
    const parsed = ResendVerificationSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: parsed.error.issues },
      })
    }
    await this.service.resendVerification(parsed.data)
    return reply.status(200).send({
      success: true,
      data: { message: 'Se o e-mail existir e não estiver verificado, você receberá um novo link.' },
    })
  }

  async forgotPassword(request: FastifyRequest, reply: FastifyReply) {
    const parsed = ForgotPasswordSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: parsed.error.issues },
      })
    }
    await this.service.forgotPassword(parsed.data)
    return reply.status(200).send({
      success: true,
      data: { message: 'Se o e-mail existir, você receberá um link de redefinição de senha.' },
    })
  }

  async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    const parsed = ResetPasswordSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: parsed.error.issues },
      })
    }
    await this.service.resetPassword(parsed.data)
    return reply.status(200).send({ success: true, data: { message: 'Senha redefinida com sucesso.' } })
  }
}
