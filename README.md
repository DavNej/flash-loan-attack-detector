## Attack detection methodology

### 1. Key characteristics of flash loan attacks

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

### 2. Detection methodology and transaction Analysis

1. Flash Loan Detection => Identify transactions that involve:
  + [x] FlashLoan event emission from know providers
  + [ ]

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

### 3. Behavioral pattern analysis

Correlate behavioral anomalies to flag suspicious transactions:

* Token price manipulation.
* Reserve depletion of a liquidity pool.
* Multiple contract interactions within a single transaction.

### 4. Malicious score calculation with a weighting system

Assign weights to the following criteria to compute a confidence score

1. Flash Loan Detected
2. New Address Used
3. Large Token Transfers
4. Multiple DeFi Interactions in the Transaction
5. Abnormal Price or Reserve Changes
6. Known Attacker Address or Similar Behavior

### 5. JSON Response

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
