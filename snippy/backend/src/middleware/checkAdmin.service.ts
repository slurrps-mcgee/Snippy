import { Request, Response, NextFunction } from "express";
import { Users } from "../models/user.model";

/**
 * Checks if the authenticated user is an admin.
 * Requires req.user.auth0Id to be set by JWT middleware.
 */
export async function checkAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const auth0Id = req.auth?.payload?.sub;
    if (!auth0Id) return res.status(401).json({ error: "Unauthorized" });

    console.log("Auth0 ID:", auth0Id);

    const user = await Users.findOne({ where: { auth0Id } });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.is_admin) {
      return res.status(403).json({ error: "Forbidden: Admins only" });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
