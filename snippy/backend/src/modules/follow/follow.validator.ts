import Joi from 'joi';
import { CustomError } from '../../common/exceptions/custom-error';

const userNameSchema = Joi.object({
  userName: Joi.string().min(1).max(50).required(),
});

export function validateFollowUserName(params: { userName?: string }): void {
  const { error } = userNameSchema.validate(params, { allowUnknown: true });
  if (error) throw new CustomError(error.message, 400);
}
