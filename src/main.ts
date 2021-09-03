import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT).then(() => {
    console.log('Server listening on port', process.env.PORT);
  });
}
bootstrap();
