import { Transaction } from 'sequelize';
import { Follows } from '../../entities/follow.entity';
import { Users } from '../../entities/user.entity';

export async function createFollow(
  followerAuth0Id: string,
  followingAuth0Id: string,
  transaction?: Transaction
): Promise<Follows> {
  return await Follows.create({ followerAuth0Id, followingAuth0Id } as any, { transaction });
}

export async function deleteFollow(
  followerAuth0Id: string,
  followingAuth0Id: string,
  transaction?: Transaction
): Promise<number> {
  return await Follows.destroy({
    where: { followerAuth0Id, followingAuth0Id },
    transaction,
  });
}

export async function findFollow(
  followerAuth0Id: string,
  followingAuth0Id: string,
  transaction?: Transaction
): Promise<Follows | null> {
  return await Follows.findOne({
    where: { followerAuth0Id, followingAuth0Id },
    transaction,
  });
}

export async function findFollowingIds(
  followerAuth0Id: string,
  transaction?: Transaction
): Promise<string[]> {
  const rows = await Follows.findAll({
    where: { followerAuth0Id },
    attributes: ['followingAuth0Id'],
    transaction,
  });
  return rows.map((r) => r.followingAuth0Id);
}

export async function countFollowers(
  followingAuth0Id: string,
  transaction?: Transaction
): Promise<number> {
  return await Follows.count({ where: { followingAuth0Id }, transaction });
}

export async function countFollowing(
  followerAuth0Id: string,
  transaction?: Transaction
): Promise<number> {
  return await Follows.count({ where: { followerAuth0Id }, transaction });
}

export async function findFollowers(
  followingAuth0Id: string,
  offset: number,
  limit: number,
  transaction?: Transaction
): Promise<{ rows: Users[]; count: number }> {
  const { rows, count } = await Follows.findAndCountAll({
    where: { followingAuth0Id },
    include: [
      {
        model: Users,
        as: 'follower',
        attributes: ['auth0Id', 'userName', 'displayName', 'bio', 'pictureUrl'],
      },
    ],
    order: [['created_at', 'DESC']],
    offset,
    limit,
    transaction,
    distinct: true,
  });

  const users = rows.map((f) => f.follower).filter((u): u is Users => !!u);

  return { rows: users, count };
}

export async function findFollowing(
  followerAuth0Id: string,
  offset: number,
  limit: number,
  transaction?: Transaction
): Promise<{ rows: Users[]; count: number }> {
  const { rows, count } = await Follows.findAndCountAll({
    where: { followerAuth0Id },
    include: [
      {
        model: Users,
        as: 'following',
        attributes: ['auth0Id', 'userName', 'displayName', 'bio', 'pictureUrl'],
      },
    ],
    order: [['created_at', 'DESC']],
    offset,
    limit,
    transaction,
    distinct: true,
  });

  const users = rows.map((f) => f.following).filter((u): u is Users => !!u);

  return { rows: users, count };
}
