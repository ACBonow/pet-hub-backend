/**
 * @module pet-health
 * @file petHealth.controller.ts
 * @description HTTP handlers for pet-health endpoints. Validates input, delegates logic to service.
 */

import type { FastifyReply, FastifyRequest } from 'fastify'
import { AddVaccinationSchema } from './petHealth.schema'
import type { PetHealthService } from './petHealth.service'

export class PetHealthController {
  constructor(private service: PetHealthService) {}

  async getVaccinationCard(
    request: FastifyRequest<{ Params: { petId: string } }>,
    reply: FastifyReply,
  ) {
    const { petId } = request.params
    const userId = request.user!.id
    const vaccinations = await this.service.getVaccinationCard(petId, userId)
    return reply.status(200).send({ success: true, data: vaccinations })
  }

  async addVaccination(
    request: FastifyRequest<{ Params: { petId: string } }>,
    reply: FastifyReply,
  ) {
    const parsed = AddVaccinationSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: parsed.error.issues },
      })
    }

    const { petId } = request.params
    const userId = request.user!.id
    const vaccination = await this.service.addVaccination(petId, userId, parsed.data)
    return reply.status(201).send({ success: true, data: vaccination })
  }

  async listExamFiles(
    request: FastifyRequest<{ Params: { petId: string } }>,
    reply: FastifyReply,
  ) {
    const { petId } = request.params
    const userId = request.user!.id
    const exams = await this.service.listExamFiles(petId, userId)
    return reply.status(200).send({ success: true, data: exams })
  }

  async uploadExamFile(
    request: FastifyRequest<{ Params: { petId: string } }>,
    reply: FastifyReply,
  ) {
    const { petId } = request.params
    const userId = request.user!.id

    let fileBuffer: Buffer | undefined
    let contentType = 'application/octet-stream'
    let filename = 'file'
    let examType: string | undefined
    let examDate: string | undefined
    let labName: string | undefined
    let notes: string | undefined

    const parts = request.parts()
    for await (const part of parts) {
      if (part.type === 'file') {
        fileBuffer = await part.toBuffer()
        contentType = part.mimetype
        filename = part.filename
      } else {
        const value = part.value as string
        if (part.fieldname === 'examType') examType = value
        else if (part.fieldname === 'examDate') examDate = value
        else if (part.fieldname === 'labName') labName = value
        else if (part.fieldname === 'notes') notes = value
      }
    }

    if (!fileBuffer || !examType || !examDate) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Campos obrigatórios: file, examType, examDate.' },
      })
    }

    const parsedDate = new Date(examDate)
    if (isNaN(parsedDate.getTime())) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'examDate inválido.' },
      })
    }

    const exam = await this.service.uploadExamFile(petId, userId, {
      file: fileBuffer,
      contentType,
      filename,
      examType,
      examDate: parsedDate,
      labName,
      notes,
    })

    return reply.status(201).send({ success: true, data: exam })
  }

  async deleteExamFile(
    request: FastifyRequest<{ Params: { petId: string; examId: string } }>,
    reply: FastifyReply,
  ) {
    const { petId, examId } = request.params
    const userId = request.user!.id
    await this.service.deleteExamFile(petId, examId, userId)
    return reply.status(204).send()
  }
}
