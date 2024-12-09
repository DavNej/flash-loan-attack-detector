import type { Address, AbiEvent } from 'viem';

type FlashLoanProvider = {
  name: string;
  eventAbi: AbiEvent;
  functionSelector: string;
  functionSignature: string;
};

export const flashLoanProviders: Record<Address, FlashLoanProvider> = {
  '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9': {
    name: 'Aave',
    eventAbi: {
      type: 'event',
      name: 'FlashLoan',
      inputs: [
        { indexed: true, name: 'target', type: 'address' },
        { indexed: true, name: 'initiator', type: 'address' },
        { indexed: true, name: 'asset', type: 'address' },
        { indexed: false, name: 'amount', type: 'uint256' },
        { indexed: false, name: 'premium', type: 'uint256' },
        { indexed: false, name: 'referralCode', type: 'uint16' },
      ],
    },
    functionSelector: '0xab9c4b5d',
    functionSignature:
      'function flashLoan(address,address[],uint256[],uint256[],address,bytes,uint16)',
  },
  '0xba12222222228d8ba445958a75a0704d566bf2c8': {
    name: 'Balancer',
    eventAbi: {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'contract IFlashLoanRecipient',
          name: 'recipient',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'contract IERC20',
          name: 'token',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'feeAmount',
          type: 'uint256',
        },
      ],
      name: 'FlashLoan',
      type: 'event',
    },
    functionSelector: '0x5c38449e',
    functionSignature:
      'function flashLoan(IFlashLoanRecipient,IERC20[],uint256[],bytes)',
  },
};

export const flashLoanEventsAbi = Object.values(flashLoanProviders).map(
  ({ eventAbi }) => eventAbi,
);

export type FlashLoanEventArgsBalancer = {
  recipient: Address;
  token: Address;
  amount: bigint;
  feeAmount: bigint;
};

export type FlashLoanEventArgsAave = {
  target: Address;
  initiator: Address;
  asset: Address;
  amount: bigint;
  premium: bigint;
  referralCode: number;
};

export type TransferEventArgs = {
  from: Address;
  to: Address;
  value: bigint;
};

export const ERC20_ABI = [
  {
    inputs: [],
    name: 'name',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [
      {
        internalType: 'uint8',
        name: '',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'transfer',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'transferFrom',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'approve',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
    ],
    name: 'allowance',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'value',
        type: 'uint256',
      },
    ],
    name: 'Transfer',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'value',
        type: 'uint256',
      },
    ],
    name: 'Approval',
    type: 'event',
  },
] as const;
