import { PasswordReset } from '../../models/passwordReset.model';

export async function createPasswordReset(record: Partial<PasswordReset>) {
  return await PasswordReset.create(record as any);
}

export async function findPasswordResetByHash(hash: string) {
  return await PasswordReset.findOne({ where: { token_hash: hash } });
}

export async function deletePasswordResetById(id: string) {
  const rec = await PasswordReset.findByPk(id);
  if (!rec) return false;
  await rec.destroy();
  return true;
}
