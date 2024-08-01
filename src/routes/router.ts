import { Router } from 'express';
import auth from '../controllers/auth';
import usuarios from '../controllers/usuarios';
import instituicoes from '../controllers/instituicoes';
import caesguia from '../controllers/caes-guia';
import validacoes from '../controllers/validacoes';
import administradores from '../controllers/administradores';
import authMiddleware from '../middlewares/authMiddleware';

const router = Router();

router.use('/auth', auth);
router.use('/usuarios', authMiddleware, usuarios);
router.use('/instituicoes', authMiddleware, instituicoes);
router.use('/caes-guia', authMiddleware, caesguia);
router.use('/validacoes', authMiddleware, validacoes);
router.use('/administradores', authMiddleware, administradores);

export default router;