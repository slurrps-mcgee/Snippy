export interface ServiceResponse<T> {
    // Snippet responses
    snippet?: T;
    snippets?: T[];
    
    // User responses
    user?: T;
    users?: T[];
    created?: boolean;
    available?: boolean;
    isFollowing?: boolean;
    followerCount?: number;
    followingCount?: number;
    
    // Comment responses
    comment?: T;
    comments?: T[];
    commentCount?: number;

    //Favorite responses
    favoriteCount?: number;
    isFavorited?: boolean;
    
    // Common responses
    totalCount?: number;
    viewCount?: number;
    counted?: boolean;
    message?: string;

    //File upload / asset responses
    url?: string;
    objectName?: string;
    asset?: T;
    assets?: T[];

    // Collection responses
    collection?: T;
    collections?: T[];
}