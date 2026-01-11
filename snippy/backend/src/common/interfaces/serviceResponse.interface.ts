export interface ServiceResponse<T> {
    // Snippet responses
    snippet?: T;
    snippets?: T[];
    
    // User responses
    user?: T;
    created?: boolean;
    available?: boolean;
    
    // Comment responses
    comment?: T;
    comments?: T[];
    commentCount?: number;

    //Favorite responses
    favoriteCount?: number;
    isFavorited?: boolean;
    
    // Common responses
    totalCount?: number;
    message?: string;
}