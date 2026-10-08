// import { NestFactory } from '@nestjs/core';
// import { ConfigService } from '@nestjs/config';
// import { ValidationPipe } from '@nestjs/common';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);

//   app.useGlobalPipes(
//     new ValidationPipe({
//       whitelist: true,
//       forbidNonWhitelisted: true,
//       transform: true,
//     }),
//   );

//   const configService = app.get(ConfigService);
//   const port = configService.get<number>('PORT') || 5000;

//   await app.listen(port);
//   console.log(`🚀 Application is running on: http://localhost:${port}`);
// }
// bootstrap();



import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cluster from 'node:cluster';
import * as os from 'node:os';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 5000;

  await app.listen(port);
  console.log(`🚀 Worker ${process.pid} running on: http://localhost:${port}`);
}

const numCPUs = os.cpus().length;

// If Primary process, fork workers for each CPU core
if (cluster.isPrimary) {
  console.log(`⚡ Primary master ${process.pid} is running`);
  console.log(`⚡ Vertically scaling across ${numCPUs} CPU cores...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.log(`⚠️ Worker ${worker.process.pid} died. Forking replacement...`);
    cluster.fork();
  });
} else {
  // Worker processes run the NestJS application
  bootstrap();
}