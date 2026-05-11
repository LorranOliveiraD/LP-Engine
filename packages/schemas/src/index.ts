import { z } from 'zod'

export const ClientSchema = z.object({
  name: z.string().min(2, "O nome é obrigatório e deve ter no mínimo 2 caracteres"),
  email: z.string().email("Formato de email inválido"),
  niche: z.string().min(2, "O nicho de atuação é obrigatório"),
})

export type CreateClientDTO = z.infer<typeof ClientSchema>

export const BriefingSchema = z.object({
  clientId: z.string().uuid("ID do cliente inválido"),
  type: z.enum(["SERVICO", "ECOMMERCE", "SAAS", "EVENTO", "PORTFOLIO"]),
  objective: z.string().min(10, "O objetivo da landing page deve ser bem detalhado (mín. 10 chars)"),
})

export type CreateBriefingDTO = z.infer<typeof BriefingSchema>
