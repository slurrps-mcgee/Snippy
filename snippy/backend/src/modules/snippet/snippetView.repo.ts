import { Transaction } from "sequelize";
import { SnippetViews } from "../../entities/snippetView.entity";

export async function findSnippetView(
    snippetId: string,
    auth0Id: string,
    transaction?: Transaction
): Promise<SnippetViews | null> {
    return await SnippetViews.findOne({
        where: { snippetId, auth0Id },
        transaction,
    });
}

export async function upsertSnippetView(
    snippetId: string,
    auth0Id: string,
    lastViewedAt: Date,
    transaction?: Transaction
): Promise<SnippetViews> {
    const existing = await findSnippetView(snippetId, auth0Id, transaction);
    if (existing) {
        await existing.update({ lastViewedAt }, { transaction });
        return existing;
    }
    return await SnippetViews.create(
        { snippetId, auth0Id, lastViewedAt } as any,
        { transaction }
    );
}
