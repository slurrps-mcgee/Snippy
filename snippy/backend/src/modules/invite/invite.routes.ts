import express from 'express';
import { generateInvite, getInviteList } from './invite.controller';
import { checkAdmin } from '../../middleware/checkAdmin.service';

const inviteRouter = express.Router();

inviteRouter.post('/', checkAdmin, generateInvite);
inviteRouter.get('/', getInviteList);

export default inviteRouter;
