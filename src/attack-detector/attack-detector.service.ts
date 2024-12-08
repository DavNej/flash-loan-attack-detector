import { Injectable } from '@nestjs/common';

import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

function createClient() {
  const client = createPublicClient({
    chain: mainnet,
    transport: http(), // can add Alchemy RPC URL
  });

  return client;
}

@Injectable()
export class AttackDetectorService {
  private client: ReturnType<typeof createClient>;

  constructor() {
    this.client = createClient();
  }

  async detectFlashLoanAttacks(blockNumberInt: number) {
    return { blockNumber };
  }
}
