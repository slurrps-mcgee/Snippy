import { NextFunction, Request, Response } from 'express';
import { updateUserService } from './user.service';
import { findById } from './user.repo';

export const updateUser = [
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            let id = req.params.id;

            // Ensure authenticated user exists
            const authSub = req.auth?.payload?.sub;
            if (!authSub) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            // Support alias 'me' to allow clients to update their own profile
            if (id === 'me') id = authSub;

            // If the authenticated user is not the target, allow only admins to proceed
            if (authSub !== id) {
                const requester = await findById(authSub);
                if (!requester || !requester.is_admin) {
                    res.status(403).json({ error: 'Forbidden' });
                    return;
                }
            }

            // Prevent updating sensitive fields from this endpoint
            const patch = { ...req.body } as any;
            delete patch.password;
            delete patch.salt;
            delete patch.userId;
            delete patch.is_admin;

            const ok = await updateUserService(id, patch);
            if (!ok) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            const updated = await findById(id);
            const user = updated && (updated.toJSON ? updated.toJSON() : { ...updated });
            if (user) {
                const u = user as any;
                delete u.password;
                delete u.salt;
            }

            res.status(200).json({ success: true, user });
        } catch (error) {
            next(error);
        }
    }
];