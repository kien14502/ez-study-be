import { Injectable, PipeTransform } from '@nestjs/common';
import isPlainObject from 'lodash/isPlainObject';
import trim from 'lodash/trim';

type Trimable = string | number | boolean | null | undefined | Trimable[] | { [key: string]: Trimable };

@Injectable()
export class TrimBodyPipe implements PipeTransform {
  transform(body: Record<string, Trimable>) {
    return this.trimData(body);
  }

  private trimData(obj: Record<string, Trimable>): Record<string, Trimable> {
    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

      const value = obj[key];

      if (typeof value === 'string') {
        obj[key] = trim(value) as Trimable;
      } else if (Array.isArray(value)) {
        obj[key] = value
          .map((v) => (isPlainObject(v) ? this.trimData(v as Record<string, Trimable>) : v))
          .filter((v) => !(typeof v === 'string' && !trim(v))) as Trimable;
      } else if (isPlainObject(value)) {
        obj[key] = this.trimData(value as Record<string, Trimable>);
      }
    }

    return obj;
  }
}
