import { Injectable } from '@nestjs/common';

import type { AbiEvent, Address, Block, Log } from 'viem';
import {
  createPublicClient,
  decodeEventLog,
  formatEther,
  http,
  parseEther,
} from 'viem';
import { mainnet } from 'viem/chains';

import type {
  FlashLoanEventArgsAave,
  FlashLoanEventArgsBalancer,
  TransferEventArgs,
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

    const transactionHighTransfertEventsLogs =
      await this.getTransactionHighTransfertEventLogs(eventLog);

    const { victimAddress, amountDrained } = await this.identifyVictim(
      transactionHighTransfertEventsLogs,
      attackerAddress,
    );

    if (amountDrained > 1000000) {
      confidenceScore += 20;
    }

    let severity = 'low';
    if (amountDrained > 10000000) {
      severity = 'critical';
    } else if (amountDrained > 1000000) {
      severity = 'high';
    } else if (amountDrained > 100000) {
      severity = 'moderate';
    }

    return {
      txHash: eventLog.transactionHash,
      isFlashLoan: true,
      isFromNewAddress,
      attackerAddress,
      isFromContract,
      victimAddress,
      confidenceScore,
      severity,
      amountDrained: formatEther(amountDrained).toString(), // amount is not in dollar. Should call an oracle to do so
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

  private async getTransactionHighTransfertEventLogs(
    eventLog: EventLog,
  ): Promise<(EventLog & { args: TransferEventArgs })[]> {
    const transfertEventLogs = await this.client.getLogs({
      event: ERC20_ABI.find(({ name }) => name === 'Transfer') as AbiEvent,
      fromBlock: this.blockNumber,
      toBlock: this.blockNumber,
    });

    const logs = [];

    for (const log of transfertEventLogs) {
      if (log.data === '0x') {
        continue;
      }

      const { args } = decodeEventLog({
        abi: ERC20_ABI,
        data: log.data,
        topics: log.topics,
      }) as { args: TransferEventArgs };

      const isLogRelevant =
        log.transactionHash === eventLog.transactionHash &&
        args.value >= parseEther('10000');

      if (isLogRelevant) {
        logs.push({ ...log, args });
      }
    }

    return logs;
  }

  private async identifyVictim(
    transferEventLogs: (EventLog & { args: TransferEventArgs })[],
    attackerAddress: Address,
  ) {
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    const victimBalances: Map<Address, bigint> = new Map();

    for (const log of transferEventLogs) {
      const { from, to, value } = log.args;
      if (![attackerAddress, ZERO_ADDRESS].includes(from)) {
        victimBalances.set(
          from,
          (victimBalances.get(from) || BigInt(0)) - value,
        );
      }

      if (![attackerAddress, ZERO_ADDRESS].includes(to)) {
        victimBalances.set(to, (victimBalances.get(to) || BigInt(0)) + value);
      }
    }

    let victimAddress: Address | null = null;
    let maxLoss = BigInt(0);

    for (const [address, balanceChange] of victimBalances) {
      if (balanceChange < BigInt(0) && balanceChange < maxLoss) {
        maxLoss = balanceChange;
        victimAddress = address;
      }
    }
    const amountDrained = -maxLoss;
    return {
      victimAddress,
      amountDrained,
    };
  }
}
