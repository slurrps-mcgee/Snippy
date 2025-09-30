import express from 'express';
import { generateInvite } from './invite.controller';
import { checkAdmin } from '../../middleware/checkAdmin.service';

const inviteRouter = express.Router();

inviteRouter.post('/', checkAdmin, generateInvite);

export default inviteRouter;
