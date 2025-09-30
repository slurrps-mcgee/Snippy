import "express";

declare module "express-serve-static-core" {
    interface Request {
        auth?: {
            payload?: {
                sub: string; // user ID
            };
        }
    }
}
