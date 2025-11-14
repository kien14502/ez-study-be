import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import duration from 'dayjs/plugin/duration';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOfAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import minMax from 'dayjs/plugin/minMax';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { DateFormat } from '../common/constants';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);
dayjs.extend(isSameOrBefore);
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOfAfter);
dayjs.extend(minMax);
dayjs.tz.setDefault('Asia/Tokyo');

export default dayjs;
export type Dayjs = dayjs.Dayjs;
export const parseDate = (
  _value: string | number | dayjs.Dayjs | Date | null,
  format = DateFormat.YYYY_MM_DD_HYPHEN,
) => {
  if (_value) return dayjs(_value).format(format);
  return _value;
};

export const getNow = () => dayjs();
