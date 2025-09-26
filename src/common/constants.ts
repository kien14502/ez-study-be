export enum OrderDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export const DEFAULT_FIRST_PAGE = 1;
export const DEFAULT_ORDER_BY = 'createdAt';
export const DEFAULT_ORDER_DIRECTION = 'desc';

export const DEFAULT_SUCCESS_MESSAGE = 'success';

export const softDeleteCondition = {
  $or: [
    {
      deletedAt: {
        $exists: true,
        $eq: null,
      },
    },
    {
      deletedAt: {
        $exists: false,
      },
    },
  ],
};

export enum DateFormat {
  YYYY_MM_DD_HYPHEN = 'YYYY-MM-DD',
  HH_mm_ss_COLON = 'HH:mm:ss',
  YYYY_MM_DD_HYPHEN_HH_mm_ss_COLON = 'YYYY-MM-DD HH:mm:ss',
  YYYY_MMM_DD_HYPHEN_HH_mm_ss_COLON = 'YYYY-MMM-DD HH:mm:ss',
  YYYY_MM_DD_HYPHEN_HH_mm_ss_Z_COLON = 'YYYY-MM-DD HH:mm:ssZ',
  DD_MM_YYYY_SLASH_HH_mm_ss_COLON = 'YYYY/MM/DD HH:mm:ss',
  YY_MM_DD_HH_mm = 'YYMMDDHHmm',
  HH_mm_COLON_DD_MM_YYYY_SLASH = 'HH:mm DD/MM/YYYY',
  ISO = 'YYYY-MM-DDTHH:mm:ss.sssZ',
  YYYY_MM_HYPHEN = 'YYYY-MM',
  DD_MM_YYYY = 'DDMMYYYY',
}

export enum CollectionName {
  USER = 'users',
  AUTH = 'auth',
}