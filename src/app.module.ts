import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AttackDetectorModule } from './attack-detector/attack-detector.module';

@Module({
  imports: [AttackDetectorModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
