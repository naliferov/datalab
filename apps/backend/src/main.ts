import { NestApplication, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as path from 'path';
import { Request, Response } from 'express';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestApplication>(AppModule);
  app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'dist')));

  await app.listen(3000);

  app.use('*', (req: Request, res: Response) => {
    res.sendFile(
      path.join(__dirname, '..', '..', 'frontend', 'dist', 'index.html'),
    );
  });
}
bootstrap();
