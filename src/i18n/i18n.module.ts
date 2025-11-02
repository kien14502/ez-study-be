import { Global, Module } from '@nestjs/common';
import { AcceptLanguageResolver, I18nModule as NestI18nModule } from 'nestjs-i18n';
import path from 'path';

import { DEFAULT_LANGUAGE } from '../common/constants';

@Global()
@Module({
  imports: [
    NestI18nModule.forRoot({
      fallbackLanguage: DEFAULT_LANGUAGE,
      loaderOptions: {
        path: path.join('dist/i18n'),
        watch: true,
      },
      resolvers: [AcceptLanguageResolver],
    }),
  ],
  controllers: [],
  providers: [],
})
export class I18nModule {}
