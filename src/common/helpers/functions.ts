import { isValidObjectId, Types } from 'mongoose';

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

export function convertTimeToUTC(time: string | Date) {
  return dayjs.tz(time, 'UTC').toDate();
}
