import { Injectable, PipeTransform } from '@nestjs/common'
import isPlainObject from 'lodash/isPlainObject'
import mapKeys from 'lodash/mapKeys'
import trim from 'lodash/trim'

@Injectable()
export class TrimBodyPipe implements PipeTransform {
  constructor() {}

  trimData(body: Record<string, any>) {
    const trimValue = (item: any) => {
      mapKeys(item, (value, key) => {
        // remove string contain only space characters
        if (typeof value === 'string') {
          item[key] = value.trim()
        }

        // iterate array
        else if (Array.isArray(value)) {
          value.forEach((subValue, index) => {
            // remove string contain only space characters
            if (typeof subValue === 'string' && !trim(subValue as string)) {
              value.splice(index, 1)
            } else if (isPlainObject(subValue)) {
              trimValue(subValue)
            }
          })
        } else if (isPlainObject(value)) {
          trimValue(value)
        }
      })
    }

    trimValue(body)
  }

  transform(body: Record<string, any>) {
    this.trimData(body)
    return body
  }
}
