import express from 'express';
import { generateInvite, markInviteUsed, validateInvite } from './invite.controller';

const inviteRouter = express.Router();

inviteRouter.post('/generate', generateInvite);
inviteRouter.post('/validate', validateInvite);
inviteRouter.post('/mark-used', markInviteUsed);

export default inviteRouter;
