import { z } from 'zod';


const cleanNumberString = (value: string) => value.replace(/[^\d]/g, '');

const institutionSchema = z.object({
  razao_social: z.string().min(1, 'Razão social é obrigatória'),
  cnpj: z.string().refine((val) => cleanNumberString(val).length === 14, {
    message: 'CNPJ deve conter exatamente 14 dígitos',
  }),
  endereco_logradouro: z.string(),
  endereco_numero: z.string().max(10, 'Endereço número deve ter no máximo 10 caracteres'),
  endereco_complemento: z.string().nullable(),
  endereco_cep: z.string().refine((val) => cleanNumberString(val).length === 8, {
    message: 'CEP deve conter exatamente 8 dígitos',
  }),
  endereco_cidade: z.string(),
  endereco_estado: z.string().length(2, 'Estado deve ter 2 caracteres'),
  endereco_bairro: z.string(),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres').max(50, 'A senha deve ter no máximo 50 caracteres')
});

export { institutionSchema };