import bcrypt from 'bcrypt';
import { isValidObjectId, Types } from 'mongoose';

import { I18nService } from 'nestjs-i18n';
import dayjs from '../../plugins/dayjs';

export function toObjectId(
  value: string | number | Types.ObjectId,
  fallbackValue: Types.ObjectId = new Types.ObjectId(),
): Types.ObjectId {
  if (value instanceof Types.ObjectId) {
    return value;
  }
  if (isValidObjectId(value)) {
    return new Types.ObjectId(String(value));
  }
  return fallbackValue;
}

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
}

export function convertTimeToUTC(time: string | Date) {
  return dayjs.tz(time, 'UTC').toDate();
}

export const handlebarHelpers = (i18n: I18nService) => ({
  t: i18n.hbsHelper,
  eq: function (arg1, arg2) {
    return arg1 === arg2;
  },
});
