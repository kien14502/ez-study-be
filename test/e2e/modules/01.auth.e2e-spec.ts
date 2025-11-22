import { AppModule } from '@/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import mongoose from 'mongoose';
import request from 'supertest';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshToken: string;

  const testUser = {
    email: 'test@example.com',
    fullName: 'Test User',
    password: '12345678',
    role: 'admin',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await app.close();
    await mongoose.connection.close();
  });

  it('/auth/register (POST)', async () => {
    const res = await request(app.getHttpServer()).post('/auth/register').send(testUser).expect(201);

    expect(res.body).toHaveProperty('email', testUser.email);
    expect(res.body).not.toHaveProperty('password');
  });

  it('/auth/login (POST)', async () => {
    const res = await request(app.getHttpServer()).post('/auth/login').send(testUser).expect(200);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');

    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('/auth/profile (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.user).toHaveProperty('email', testUser.email);
  });

  it('/auth/refresh (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('/auth/logout (POST)', async () => {
    await request(app.getHttpServer()).post('/auth/logout').set('Authorization', `Bearer ${accessToken}`).expect(200);
  });
});
