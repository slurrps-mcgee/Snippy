import "express";

declare module "express-serve-static-core" {
    interface Request {
        auth?: {
            payload?: {
                sub: string; // Auth0 user ID
            };
        }
    }
}
