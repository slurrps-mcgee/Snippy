import express from 'express';
import { generateInvite, markInviteUsed, validateInvite } from './invite.controller';
import { checkAdmin } from '../../middleware/checkAdmin.service';
import jwtCheck from '../../middleware/jwt.service';

const inviteRouter = express.Router();

//Add checkadmin to generate invite route
inviteRouter.post('/generate', generateInvite);
inviteRouter.post('/validate', validateInvite);
inviteRouter.post('/mark-used', markInviteUsed);

// Debug route to inspect req.auth and req.user
inviteRouter.get("/debug", jwtCheck, (req, res) => {
  console.log("req.auth:", req.auth);
  console.log("req.user:", (req as any).user);
  res.json({ auth: req.auth, user: (req as any).user });
});


export default inviteRouter;
