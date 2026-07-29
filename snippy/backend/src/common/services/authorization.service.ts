import { CustomError } from '../exceptions/custom-error';

/**
 * Authorization service for checking resource ownership and permissions
 */
export class AuthorizationService {
    /**
     * Verify that the current user owns the resource
     * @throws CustomError with 403 if not authorized
     */
    static verifyOwnership(resourceAuth0Id: string, currentAuth0Id: string, resourceType: string = 'resource'): void {
        if (resourceAuth0Id !== currentAuth0Id) {
            throw new CustomError(`Forbidden: not ${resourceType} owner`, 403);
        }
    }

    /**
     * Check if user owns the resource without throwing
     */
    static isOwner(resourceAuth0Id: string, currentAuth0Id: string): boolean {
        return resourceAuth0Id === currentAuth0Id;
    }
}
