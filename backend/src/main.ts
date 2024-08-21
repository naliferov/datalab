import { NestApplication, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as path from 'path';
import { Request, Response } from 'express';
import * as express from 'express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestApplication>(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  
  //app.useGlobalPipes(new Transformation());
  //app.useGlobalPipes(new NormalizeQueryParamsPipe());

  app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'dist')));

  app.use(
    '/api',
    express.static(
      path.join(__dirname, '..', 'node_modules', 'swagger-ui-dist'),
    ),
  );
  const options = new DocumentBuilder()
    .setTitle('Varcraft API')
    .setDescription('Varcraft API description')
    .setVersion('1.0')
    //.addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document, {
    jsonDocumentUrl: 'api-json',
  });

  await app.listen(3000);

  app.use('*', (req: Request, res: Response) => {
    res.sendFile(
      path.join(__dirname, '..', '..', 'frontend', 'dist', 'index.html'),
    );
  });
}
bootstrap();
