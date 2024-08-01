import { z } from 'zod';
import { sanitizeInput } from '../utils/sanitize';


const cleanNumberString = (value: string) => value.replace(/[^\d]/g, '');

const userSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').transform(sanitizeInput),
  email: z.string().email('Email inválido').transform(sanitizeInput),
  senha: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres').max(50, 'A senha deve ter no máximo 50 caracteres'),
  cpf: z.string().refine((val) => cleanNumberString(val).length === 11, {
    message: 'CPF deve conter exatamente 11 dígitos',
  }).transform(sanitizeInput),
  sexo: z.enum(["masc", "fem", "nao-bin"]),
  data_nascimento: z.string(),
  endereco_logradouro: z.string().transform(sanitizeInput),
  endereco_numero: z.string().max(10, 'Endereço número deve ter no máximo 10 caracteres').transform(sanitizeInput),
  endereco_complemento: z.string().nullable().transform(val => val ? sanitizeInput(val) : val),
  endereco_cep: z.string().refine((val) => cleanNumberString(val).length === 8, {
    message: 'CEP deve conter exatamente 8 dígitos',
  }).transform(sanitizeInput),
  endereco_cidade: z.string().transform(sanitizeInput),
  endereco_estado: z.string().length(2, 'Estado deve ter 2 caracteres').transform(sanitizeInput),
  endereco_bairro: z.string().transform(sanitizeInput),
  rg: z.string().refine((val) => {
    const len = cleanNumberString(val).length;
    return len >= 7 && len <= 14;
  }, {
    message: 'RG deve conter entre 7 e 14 dígitos',
  }).transform(sanitizeInput),
  telefone: z.string().transform(sanitizeInput),
  id_instituicao: z.number()
});

export { userSchema };