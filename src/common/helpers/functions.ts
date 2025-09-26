import dayjs from '../../plugins/dayjs';
import { isValidObjectId, Types } from 'mongoose'

export function toObjectId(value: any, fallbackValue: Types.ObjectId = new Types.ObjectId()): Types.ObjectId {
  try {
    if (value instanceof Types.ObjectId) {
      return value
    }
    if (isValidObjectId(value)) {
      return new Types.ObjectId(String(value))
    }
    return fallbackValue
  } catch (error) {
    throw error
  }
}

export function convertTimeToUTC(time: string | Date) {
    return dayjs.tz(time, 'UTC').toDate();
}