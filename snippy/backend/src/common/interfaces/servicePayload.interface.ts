export interface ServicePayload {
    auth?: { payload?: { sub: string } };
    body?: any;
    params?: any;
    query?: any;
}