import express from 'express';
import { generateInvite, markInviteUsed, validateInvite } from './invite.controller';
import { checkAdmin } from '../../middleware/checkAdmin.service';
import jwtCheck from '../../middleware/jwt.service';

const inviteRouter = express.Router();

//Add checkadmin to generate invite route
inviteRouter.post('/generate', generateInvite);

inviteRouter.post('/validate', validateInvite);
inviteRouter.post('/mark-used', markInviteUsed);

export default inviteRouter;
