import { CustomError } from '../../common/exceptions/custom-error';
import { handleError } from '../../common/utilities/error';
import { executeInTransaction } from '../../common/utilities/transaction';
import { PaginationService, PaginationQuery } from '../../common/services/pagination.service';
import { ServicePayload } from '../../common/interfaces/servicePayload.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { findByUsername } from '../user/user.repo';
import { UserMapper } from '../user/user.mapper';
import { UserDTO } from '../user/dto/user.dto';
import { FollowStatusDTO } from './dto/follow.dto';
import {
    createFollow,
    deleteFollow,
    findFollow,
    findFollowers,
    findFollowing,
} from './follow.repo';

export async function followUserHandler(
    payload: ServicePayload<unknown, { userName: string }>
): Promise<ServiceResponse<FollowStatusDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) {
            throw new CustomError('Authentication required', 401);
        }

        const userName = payload.params?.userName;
        if (!userName) {
            throw new CustomError('Username required', 400);
        }

        return await executeInTransaction(async (t) => {
            const target = await findByUsername(userName, t);
            if (!target) {
                throw new CustomError('User not found', 404);
            }

            if (target.auth0Id === auth0Id) {
                throw new CustomError('Cannot follow yourself', 400);
            }

            if (target.isPrivate) {
                throw new CustomError('Forbidden: cannot follow a private profile', 403);
            }

            const existing = await findFollow(auth0Id, target.auth0Id, t);
            if (existing) {
                return { message: 'Already following', isFollowing: true };
            }

            await createFollow(auth0Id, target.auth0Id, t);
            return { message: 'Followed successfully', isFollowing: true };
        });
    } catch (err) {
        handleError(err, 'followUserHandler');
    }
}

export async function unfollowUserHandler(
    payload: ServicePayload<unknown, { userName: string }>
): Promise<ServiceResponse<FollowStatusDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) {
            throw new CustomError('Authentication required', 401);
        }

        const userName = payload.params?.userName;
        if (!userName) {
            throw new CustomError('Username required', 400);
        }

        return await executeInTransaction(async (t) => {
            const target = await findByUsername(userName, t);
            if (!target) {
                throw new CustomError('User not found', 404);
            }

            await deleteFollow(auth0Id, target.auth0Id, t);
            return { message: 'Unfollowed successfully', isFollowing: false };
        });
    } catch (err) {
        handleError(err, 'unfollowUserHandler');
    }
}

export async function getFollowersHandler(
    payload: ServicePayload<unknown, { userName: string }, PaginationQuery>
): Promise<ServiceResponse<UserDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        const userName = payload.params?.userName;
        if (!userName) {
            throw new CustomError('Username required', 400);
        }

        const { offset, limit } = PaginationService.getPaginationParams(payload.query || {});

        return await executeInTransaction(async (t) => {
            const target = await findByUsername(userName, t);
            if (!target) {
                throw new CustomError('User not found', 404);
            }

            if (target.isPrivate && target.auth0Id !== auth0Id) {
                throw new CustomError('Forbidden: user profile is private', 403);
            }

            const result = await findFollowers(target.auth0Id, offset, limit, t);
            return {
                users: UserMapper.toDTOs(result.rows),
                totalCount: result.count,
            };
        });
    } catch (err) {
        handleError(err, 'getFollowersHandler');
    }
}

export async function getFollowingHandler(
    payload: ServicePayload<unknown, { userName: string }, PaginationQuery>
): Promise<ServiceResponse<UserDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        const userName = payload.params?.userName;
        if (!userName) {
            throw new CustomError('Username required', 400);
        }

        const { offset, limit } = PaginationService.getPaginationParams(payload.query || {});

        return await executeInTransaction(async (t) => {
            const target = await findByUsername(userName, t);
            if (!target) {
                throw new CustomError('User not found', 404);
            }

            if (target.isPrivate && target.auth0Id !== auth0Id) {
                throw new CustomError('Forbidden: user profile is private', 403);
            }

            const result = await findFollowing(target.auth0Id, offset, limit, t);
            return {
                users: UserMapper.toDTOs(result.rows),
                totalCount: result.count,
            };
        });
    } catch (err) {
        handleError(err, 'getFollowingHandler');
    }
}
