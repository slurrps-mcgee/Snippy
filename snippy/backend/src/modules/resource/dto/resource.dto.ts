export interface CreateResourceRequest {
    file: {
        originalname: string;
        buffer: Buffer<ArrayBufferLike>;
        mimetype: string;
    };
    subFolder?: string;
}