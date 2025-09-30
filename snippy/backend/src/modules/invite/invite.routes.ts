import express from 'express';
import { generateInvite,} from './invite.controller';
import { checkAdmin } from '../../middleware/checkAdmin.service';
import jwtCheck from '../../middleware/jwt.service';

const inviteRouter = express.Router();

inviteRouter.post('/generate', jwtCheck, checkAdmin, generateInvite);

export default inviteRouter;
