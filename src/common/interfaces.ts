import { OrderDirection } from './constants';

export class CommonListQuery {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: OrderDirection;
  keyword?: string;
}
