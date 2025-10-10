import express from 'express';
import { register, login, me, refreshToken, forgotPasswordRoute, resetPasswordRoute } from './auth.controller';
import { jwtCheck } from '../../middleware/jwt.service';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refreshToken', refreshToken);
router.post('/forgot', forgotPasswordRoute);
router.post('/reset', resetPasswordRoute);

// protected - returns currently authenticated user
router.get('/me', me);

export default router;
