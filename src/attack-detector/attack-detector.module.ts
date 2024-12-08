import { Module } from '@nestjs/common';
import { AttackDetectorController } from './attack-detector.controller';
import { AttackDetectorService } from './attack-detector.service';

@Module({
  controllers: [AttackDetectorController],
  providers: [AttackDetectorService],
})
export class AttackDetectorModule {}
