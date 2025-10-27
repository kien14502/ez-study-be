import { ConfigService } from '@nestjs/config';

import ConfigKey from '@/common/config-key';

export const dbConfig = async (configService: ConfigService) => {
  const uri = configService.get<string>(ConfigKey.MONGO_DATABASE_CONNECTION_STRING, 'mongodb://mongodb:27017/ez-study');
  return { uri };
};
