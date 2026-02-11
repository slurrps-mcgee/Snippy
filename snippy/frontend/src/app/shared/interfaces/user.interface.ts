import { Assets } from "./asset.interface";

export interface User {
    userName: string;
    displayName: string;
    bio?: string;
    pictureUrl?: string;
    assets?: Assets[];
}