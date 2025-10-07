import express from 'express';
import { register, login, me, refresh } from './auth.controller';
import jwtCheck from '../../middleware/jwt.service';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
// protected - returns currently authenticated user
router.get('/me', me);

export default router;
