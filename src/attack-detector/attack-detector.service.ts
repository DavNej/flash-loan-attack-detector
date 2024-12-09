import { Injectable } from '@nestjs/common';

import type { AbiEvent, Address, Block, Log } from 'viem';
import { createPublicClient, decodeEventLog, http, parseEther } from 'viem';
import { mainnet } from 'viem/chains';

import type {
  FlashLoanEventArgsAave,
  FlashLoanEventArgsBalancer,
} from './utils';
import { flashLoanEventsAbi, flashLoanProviders, ERC20_ABI } from './utils';

type EventLog = Log<
  bigint,
  number,
  false,
  undefined,
  undefined,
  AbiEvent[],
  string
>;

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
  private blockDate: Date;
  private blockNumber: bigint;
  private block: Block;

  constructor() {
    this.client = createClient();
  }

  async detectFlashLoanAttacks(blockNumberInt: number) {
    this.blockNumber = BigInt(blockNumberInt);
    this.block = await this.client.getBlock({ blockNumber: this.blockNumber });
    this.blockDate = new Date(Number(this.block.timestamp) * 1000);

    const flashLoanEventLogs = await this.client.getLogs({
      events: flashLoanEventsAbi,
      fromBlock: this.blockNumber,
      toBlock: this.blockNumber,
    });

    const attacks = [];

    for (const eventLogs of flashLoanEventLogs) {
      const attack = await this.investigate(eventLogs);

      // to be improved
      if (attack.confidenceScore > 20) {
        attacks.push(attack);
      }
    }

    return {
      blockNumber: blockNumberInt,
      chainId: this.client.chain.id,
      presenceOfAttack: attacks.length > 0,
      attacks,
    };
  }

  private async investigate(eventLog: EventLog) {
    // base score of 20 because of the flash loan
    let confidenceScore = 20;

    const { loanAmount, loanTokenSymbol, flashLoanProvider } =
      await this.getFlashLoanInfo(eventLog);

    if (BigInt(loanAmount) > parseEther('100000')) {
      confidenceScore += 10;
    }

    const txReceipt = await this.client.getTransactionReceipt({
      hash: eventLog.transactionHash,
    });

    const attackerAddress = txReceipt.from;

    const isFromContract = await this.isContract(attackerAddress);
    if (isFromContract) {
      confidenceScore += 10;
    }

    const isFromNewAddress = await this.isNewAddress(attackerAddress);
    if (isFromNewAddress) {
      confidenceScore += 10;
    }

    const transactionComplexity = txReceipt.logs.length;
    if (transactionComplexity > 20) {
      confidenceScore += 20;
    }
    return {
      txHash: eventLog.transactionHash,
      isFlashLoan: true,
      isFromNewAddress,
      attackerAddress,
      isFromContract,
      confidenceScore,
      loanTokenSymbol,
      flashLoanProvider,
      attackTime: this.blockDate.toLocaleString(),
    };
  }

  private async getFlashLoanInfo(eventLog: EventLog) {
    const flashLoanProvider = flashLoanProviders[eventLog.address];
    if (!flashLoanProvider) {
      throw new Error(
        `Unknown flash loan provider at address ${eventLog.address}`,
      );
    }

    const decodedEvent = decodeEventLog({
      abi: [flashLoanProvider.eventAbi],
      data: eventLog.data,
      topics: eventLog.topics,
    });

    let loanAmount: bigint;
    let loanTokenSymbol: string;

    if (flashLoanProvider.name === 'Aave') {
      const { args } = decodedEvent as { args: FlashLoanEventArgsAave };
      loanAmount = args.amount;
      loanTokenSymbol = await this.getTokenSymbol(args.asset);
    }

    if (flashLoanProvider.name === 'Balancer') {
      const { args } = decodedEvent as { args: FlashLoanEventArgsBalancer };
      loanAmount = args.amount;
      loanTokenSymbol = await this.getTokenSymbol(args.token);
    }

    return {
      loanAmount,
      loanTokenSymbol,
      flashLoanProvider: flashLoanProvider.name,
    };
  }

  private async getTokenSymbol(address: Address) {
    const symbol = await this.client.readContract({
      address,
      abi: ERC20_ABI,
      functionName: 'symbol',
    });

    return symbol;
  }

  private async isContract(address: Address): Promise<boolean> {
    const code = await this.client.getCode({ address });
    return code !== '0x';
  }

  private async isNewAddress(address: Address) {
    const txCount = await this.client.getTransactionCount({ address });
    return txCount === 0;
  }
}
