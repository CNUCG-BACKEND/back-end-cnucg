import { z } from 'zod';

const caesGuiaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  sexo: z.enum(['masc', 'fem'], { errorMap: () => ({ message: 'Sexo deve ser "masc" ou "fem"' }) }),
  cor: z.string().min(1, 'Cor é obrigatória'),
  data_nascimento: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Data de nascimento inválida',
  }),
  raca: z.string().min(1, 'Raça é obrigatória'),
  numero_registro: z.string().min(1, 'Número de registro é obrigatório'),
  id_instituicao: z.number().nullable().optional(),
  id_usuario: z.number().nullable().optional(),
});

export { caesGuiaSchema };