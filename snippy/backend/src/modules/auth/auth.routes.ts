import express from 'express';
import { register, login } from './auth.controller';
import jwtCheck from '../../middleware/jwt.service';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

export default router;
