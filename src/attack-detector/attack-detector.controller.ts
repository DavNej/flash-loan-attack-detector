import { Controller, Post, Body } from '@nestjs/common';
import { AttackDetectorService } from './attack-detector.service';

@Controller('detect-attack')
export class AttackDetectorController {
  constructor(private readonly attackDetectorService: AttackDetectorService) {}

  @Post()
  async detectAttackDetector(@Body('blockNumber') blockNumber: number) {
    if (!blockNumber) {
      throw new Error('blockNumber is required');
    }

    try {
      const result =
        await this.attackDetectorService.detectFlashLoanAttacks(blockNumber);
      return result;
    } catch (error) {
      console.error(error);
      throw new Error('Error detecting attack');
    }
  }
}
