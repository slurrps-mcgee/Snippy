import { Request, Response, NextFunction } from "express";
import { findById } from "../modules/user/user.repo";
import logger from '../utils/logger';

/**
 * Checks if the authenticated user is an admin.
 */
export async function checkAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.payload?.sub;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.isAdmin) {
      return res.status(403).json({ error: "Forbidden: Admins only" });
    }

    next();
  } catch (err) {
    logger.error('Error in checkAdmin middleware', err);
    next(err);
  }
}
