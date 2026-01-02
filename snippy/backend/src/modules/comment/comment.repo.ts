import { Transaction } from "sequelize";
import { Comments } from "../../entities/comment.entity";
import { Users } from "../../entities/user.entity";

// #region Comment CREATE/UPDATE/DELETE
// Create Comment
export async function createComment(
    commentData: Partial<Comments>,
    transaction?: Transaction
): Promise<Comments> {
    const created = await Comments.create(commentData as any, { transaction });
    return created;
}

// Update Comment
export async function updateComment(
    commentId: string,
    patch: Partial<Comments>,
    transaction?: Transaction
): Promise<void> {
    const [updated] = await Comments.update(patch, { where: { commentId }, transaction });
    if (updated === 0) {
        throw new Error('Comment not found or no changes made');
    }
}

// Delete Comment
export async function deleteComment(
    commentId: string,
    transaction?: Transaction
): Promise<void> {
    await Comments.destroy({ where: { commentId }, transaction });
}
// #endregion

// #region Comment READ
// Find comments by snippetId
export async function findCommentsBySnippetId(
    snippetId: string,
    offset?: number,
    limit?: number,
    transaction?: Transaction
): Promise<{ rows: Comments[]; count: number }> {
    return await Comments.findAndCountAll({
        where: { snippetId },
        include: [{ model: Users, attributes: ['userName', 'displayName'] }],
        order: [['created_at', 'ASC']],
        offset,
        limit,
        transaction,
        distinct: true
    });
}


export async function findCommentsByUserAndSnippetId(
    auth0Id: string,
    snippetId: string,
    transaction?: Transaction
): Promise<Comments[] | null> {
    return await Comments.findAll({
        where: { auth0Id, snippetId },
        transaction
    });
}

export async function findCommentByCommentId(
    commentId: string,
    transaction?: Transaction
): Promise<Comments | null> {
    return await Comments.findOne({
        where: { commentId },
        transaction
    });
}
// #endregion