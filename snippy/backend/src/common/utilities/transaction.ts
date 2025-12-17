import { Transaction } from 'sequelize';
import { sequelize } from '../../database/sequelize';
import logger from './logger';

/**
 * Wrapper for Sequelize transactions that adds explicit rollback logging
 * Useful for debugging transaction failures and understanding when data operations fail
 * 
 * @param callback - The transaction callback function
 * @param context - Context string for logging (e.g., 'createSnippet', 'updateUser'). Defaults to 'transaction'
 * @returns Promise resolving to the callback result
 */
export async function executeInTransaction<T>(
    callback: (transaction: Transaction) => Promise<T>,
    context: string = 'transaction'
): Promise<T> {
    const transactionId = generateTransactionId();
    
    logger.debug(`[Transaction ${transactionId}] Starting transaction for: ${context}`);
    
    try {
        const result = await sequelize.transaction(async (t) => {
            try {
                const callbackResult = await callback(t);
                logger.debug(`[Transaction ${transactionId}] Successfully completed: ${context}`);
                return callbackResult;
            } catch (error) {
                // Log the error before Sequelize automatically rolls back
                logger.warn(`[Transaction ${transactionId}] Rolling back transaction for: ${context}`, {
                    error: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined
                });
                throw error; // Re-throw to trigger Sequelize rollback
            }
        });
        
        return result;
    } catch (error) {
        logger.error(`[Transaction ${transactionId}] Transaction failed for: ${context}`, {
            error: error instanceof Error ? error.message : String(error)
        });
        throw error; // Re-throw to be handled by service error handler
    }
}

/**
 * Generate a short transaction ID for log correlation
 */
function generateTransactionId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}
