## Setup Intructions

### Prerequisites

   - Install Node.js (v16.x or later)
   - Ensure `npm` is installed along with Node.js

### Setup

1. Clone the repository and install dependencies

```bash
git clone https://github.com/DavNej/flash-loan-attack-detector.git
cd flash-loan-attack-detector
npm install
```

2. Start the NestJS server

```bash
npm run start
```

3. Send POST request to API

Example `curl` command:

```bash
curl -X POST http://localhost:3000/detect-attack -H "Content-Type: application/json" -d '{"blockNumber": 16818057}'
```

Example response:

```json
{
  "blockNumber": 16818057,
  "chainId": 1,
  "presenceOfAttack": true,
  "attacks": [
    {
      "txHash": "0x71a908be0bef6174bccc3d493becdfd28395d78898e355d451cb52f7bac38617",
      "isFlashLoan": true,
      "isFromNewAddress": false,
      "attackerAddress": "0xb2698c2d99ad2c302a95a8db26b08d17a77cedd4",
      "isFromContract": true,
      "victimAddress": "0xe025e3ca2be02316033184551d4d3aa22024d9dc",
      "confidenceScore": 50,
      "severity": "high",
      "amountLostInDollars": 18519070,
      "loanTokenSymbol": "WBTC",
      "flashLoanProvider": "Aave",
      "attackTime": "3/13/2023, 10:03:23 AM"
    }
  ]
}
```

## Instructions

### Objective

Flash loans are widely used in DeFi but are increasingly exploited by malicious actors to manipulate prices or drain funds from protocols. The task is to design and implement a **Flash Loan Attack Detector Service** that would have flagged the *Euler Finance flash loan attack*, given on-chain data. Any tools/strategies can be used.

Below, 2 links explaining the attack:

* https://medium.com/coinmonks/decoding-euler-finances-197-million-exploit-quillaudits-c70fed910d2c
* https://www.immunebytes.com/blog/euler-finance-hack-mar-13-2023-detailed-hack-analysis/

### Deliverable

**API route**

* `POST` API route that accepts a `{ "blockNumber": 16818057 }` in the request body.
* This route should detect any attack within this block. **While the Euler finance hack serves as an example, the service should be capable of identifying any similar type of exploit.**

**Attack Detection Criteria**

* The service should be able to detect the specifics of the **Euler Finance attack** using on-chain data.
* At minimum, the service output should include the **transaction hash (txHash)** of any suspicious or detected attack transactions. With a **malicious score** for every transaction.
* Other output considered relevant for identifying potential attacks can be added to the response.

**Exemple response**

```json
{
  "blockNumber": 1203123,
  "chainId":"0x1",
  "presenceOfAttack":true,
  "attacks":[
    {
      "attackId": 1,
      "txHash": "0x11",
      "attackTime": "",
      "isFloasLoan":true,
      "attackerAddress": "0x111",
      "victimAddress": "",
      "amountLostInDollars":1231273.123,
      "severity": "critical"
      ...
    }
  ]
  ...
}
```

### Details of the Euler Finance attack

Involved ddresses:

* Attacker EOA-1:         0xb66cd966670d962c227b3eaba30a872dbfb995db
* Attacker EOA-2:         0xb2698c2d99ad2c302a95a8db26b08d17a77cedd4
* Attacker Contract-1:    0xeBC29199C817Dc47BA12E3F86102564D640CBf99
* Attacker Contract-2:    0x036cec1a199234fc02f72d29e596a09440825f1c
* Attacker Contract-3:    0xD3b7CEA28Feb5E537fcA4E657e3f60129456eaF3
* Attacker Contract-4:    0x0b812c74729b6aBc723F22986C61D95344ff7ABA
* Victim Contract:        0xe025e3ca2be02316033184551d4d3aa22024d9dc

Transactions hashes:

* [0xc310a0affe2169d1f6feec1c63dbc7f7c62a887fa48795d327d4d2da2d6b111d](https://etherscan.io/tx/0xc310a0affe2169d1f6feec1c63dbc7f7c62a887fa48795d327d4d2da2d6b111d)
* [0x71a908be0bef6174bccc3d493becdfd28395d78898e355d451cb52f7bac38617](https://etherscan.io/tx/0x71a908be0bef6174bccc3d493becdfd28395d78898e355d451cb52f7bac38617)
* [0x62bd3d31a7b75c098ccf28bc4d4af8c4a191b4b9e451fab4232258079e8b18c4](https://etherscan.io/tx/0x62bd3d31a7b75c098ccf28bc4d4af8c4a191b4b9e451fab4232258079e8b18c4)
* [0x465a6780145f1efe3ab52f94c006065575712d2003d83d85481f3d110ed131d9](https://etherscan.io/tx/0x465a6780145f1efe3ab52f94c006065575712d2003d83d85481f3d110ed131d9)
* [0x3097830e9921e4063d334acb82f6a79374f76f0b1a8f857e89b89bc58df1f311](https://etherscan.io/tx/0x3097830e9921e4063d334acb82f6a79374f76f0b1a8f857e89b89bc58df1f311)
* [0x47ac3527d02e6b9631c77fad1cdee7bfa77a8a7bfd4880dccbda5146ace4088f](https://etherscan.io/tx/0x47ac3527d02e6b9631c77fad1cdee7bfa77a8a7bfd4880dccbda5146ace4088f)

## Attack detection methodology (and potential improvements)

### Key characteristics of flash loan attacks

* Known Flash Loan Providers: Aave, Balancer, etc.
* Flash loan involves borrowing a large amount of tokens and repay it within the same transaction.

* Anomalous token movement:
  + Large inflows followed by large outflows in the same transaction.
  + Multiple interactions with DeFi protocols (lending, swapping, withdrawing, etc.)

* Contract Behavior:
  + Interaction with protocols or pools to manipulate token prices, reserves, etc.

* Address History:
  + Newly created EOAs or smart contracts involved

* Transaction complexity:
  + Significant number of actions like token transfers in a single transaction

### Detection methodology and transaction Analysis

1. Flash Loan Detection => Identify transactions that involve:
  + [x] FlashLoan event emission from known providers

2. Analyze transactions for large balance changes in contracts:
  + [ ] Look for significant inflows followed by outflows within the same transaction.
  + [ ] Spot sharp reserve changes in liquidity pools or vaults.
  + [ ] Identify unusual token swaps (e.g., large price deviations).

3. New Address Detection
  + [x] Check if `from` address is a freshly deployed contract
  + [x] Check if `from` address is a new EOA with no prior transaction history

4. Contract Creation
  + [ ] Identify contracts deployed within the block that interact with Flash loan providers, DeFi protocols or pools.

5. Anomalous Patterns:
  + [ ] High-value transfers involving multiple DeFi protocols (e.g., lending, swapping, withdrawing).
  + [ ] Complex operations in a single transaction.

6. High transaction fees:
  + [ ] Various token manipulations lead to high gas fees

### Behavioral pattern analysis

Correlate behavioral anomalies to flag suspicious transactions:

* Token price manipulation.
* Reserve drainage of a liquidity pool.
* Multiple contract interactions within a single transaction.

### Malicious score calculation with a weighting system

Assign weights to the following criteria to compute a confidence score

1. Flash Loan Detected
2. New Address Used
3. Large Token Transfers
4. Multiple DeFi Interactions in the Transaction
5. Abnormal Price or Reserve Changes
6. Known Attacker Address or Similar Behavior

### API Response

The API should return a structured response including:

* `txHash` : Transaction hash of the detected attack.
* `attackTime` : Timestamp of the attack.
* `isFlashLoan` : Boolean to confirm if a flash loan was involved.
* `attackerAddress` : Address initiating the transaction.
* `victimAddress` : Victim of the attack.
* `amountLostInDollars` : Approximate amount lost due to the attack.
* `confidenceScore` : A score representing the likelihood of malicious intent.
* `isFromNewAddress` : Boolean indicating whether the transaction initiator is a new address.
* `isFromContract` : Boolean indicating whether the transaction initiator is a contract.
* `loanTokenSymbol` : The symbol of the loaned token.
* `flashLoanProvider` : The name of the protocol where the flash loan was taken.
* `severity` : Categorize as critical, high, moderate, or low.

## Tools

* **NestJS** : Backend framework for building APIs
* **Viem** : Interacts with the Ethereum blockchain. Type-safe library for reading contracts, decoding logs, and querying blockchain data
* **Etherscan** : Ethereum block explorer to explore transactions, logs, and contracts
* **Blocksec.com/explorer** : Detailed blockchain transaction analysis tool. Useful to investigate and understand what was done in a transaction.
