import express from 'express';
import { register, login, me } from './auth.controller';
import jwtCheck from '../../middleware/jwt.service';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
// protected - returns currently authenticated user
router.get('/me', jwtCheck, me);

export default router;
