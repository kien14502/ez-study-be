export enum OrderDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export enum OrderBy {
  ID = '_id',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export const DEFAULT_PORT = 3000;
export const DEFAULT_FIRST_PAGE = 1;
export const DEFAULT_ORDER_BY = 'createdAt';
export const DEFAULT_ORDER_DIRECTION = 'desc';
export const DEFAULT_LANGUAGE = 'en';

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

export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
}

export enum MongoCollection {
  USERS = 'users',
  ACCOUNTS = 'accounts',
  WORKSPACES = 'workspaces',
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
}

export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum NodeEnv {
  DEVELOPMENT = 'development',
  TEST = 'test',
  PRODUCTION = 'production',
}

export enum MissionCode {
  LOGIN = 'login',
  DO_1_EXERCISE = 'do_1_exercise',
  DO_2_EXERCISES = 'do_2_exercises',
  DO_5_EXERCISES = 'do_5_exercises',
  DO_1_HOMEWORK = 'do_1_homework',
  DO_2_HOMEWORKS = 'do_2_homeworks',
  VIEW_THEORY = 'view_theory',
  COMPLETE_ALL = 'complete_all',
}

export const MissionDefinitions = {
  [MissionCode.LOGIN]: {
    title: 'Đăng nhập mỗi ngày',
    reward: { stars: 2, diamonds: 5 },
    goal: 1,
    category: 'login',
  },
  [MissionCode.DO_1_EXERCISE]: {
    title: 'Làm 1 bài tập bất kỳ trong nhiệm vụ',
    reward: { stars: 5, diamonds: 10 },
    goal: 1,
    category: 'exercise',
  },
  [MissionCode.DO_2_EXERCISES]: {
    title: 'Làm 2 bài tập bất kỳ trong nhiệm vụ',
    reward: { stars: 5, diamonds: 10 },
    goal: 2,
    category: 'exercise',
  },
  [MissionCode.DO_1_HOMEWORK]: {
    title: 'Làm 1 bài tập về nhà môn bất kỳ',
    reward: { stars: 2, diamonds: 5 },
    goal: 1,
    category: 'homework',
  },
  [MissionCode.VIEW_THEORY]: {
    title: 'Xem lý thuyết một bài bất kỳ',
    reward: { stars: 2, diamonds: 5 },
    goal: 1,
    category: 'theory',
  },
};

export enum ETopicKafka {
  REGISTER_ACCOUNT = 'email.verify',
}
