# CoindPay – PayForwarder

A minimal, non-custodial settlement forwarder contract for fiat-to-crypto payment flows.

`PayForwarder` is designed for **payment protocols**, not DeFi speculation.
It enables **explicit-amount settlement**, flexible fee models, and low-gas execution for ETH and ERC20 assets.

---

## ✨ Key Features

- ✅ **Explicit Amount Settlement** (not balance-based)
- ✅ **Non-custodial** (no funds locked, only forwarded)
- ✅ **ETH & ERC20 compatible**
- ✅ **Per-settlement flexible fee & reserve**
- ✅ **Low gas cost**
- ✅ **Auditable & deterministic**
- ✅ **No on-chain merchant state**

---

## 🧠 Design Philosophy

> **All uncertainty stays off-chain. On-chain only executes deterministic settlement.**

- Off-chain systems (e.g. Mercuryo, PSPs, internal ledgers) calculate:
  - settlement amount
  - fee rate
  - reserve rate

- The smart contract:
  - validates inputs
  - executes transfers atomically
  - emits settlement events

This mirrors real-world payment processors such as Stripe / Adyen, adapted for EVM.

---

## 📐 Settlement Model

For each settlement:

```
amount = merchantAmount + feeAmount + reserveAmount
```

Where:

```
feeAmount     = amount × feeBps / 10_000
reserveAmount = amount × reserveBps / 10_000
merchantAmount = amount - feeAmount - reserveAmount
```

- `feeBps + reserveBps ≤ 5000` (max 50%)
- All calculations use integer math
- Rounding is deterministic (floor)

---

## 🔢 Amount Handling (Very Important)

### ERC20 Tokens

- Amounts **must be passed in the smallest unit**
- Example for USDC (6 decimals):

```
94.5689 USDC → 94,568,900
```

```json
"amount": "94568900"
```

### ETH

- Amounts are in wei
- Example:

```
0.01 ETH → 10,000,000,000,000,000 wei
```

---

## 🧾 Contract Interface

### `forward`

```solidity
function forward(
    address token,        // address(0) for ETH
    address merchant,
    address treasury,
    uint256 amount,       // smallest unit
    uint256 feeBps,
    uint256 reserveBps
) external;
```

#### Requirements

- Caller must be whitelisted
- Contract balance ≥ amount
- Merchant & treasury must be non-zero addresses

---

## 🔐 Access Control

- `owner` manages allowed callers
- Only allowed callers can execute settlements
- No merchant-specific on-chain permissions

```solidity
mapping(address => bool) public allowedCallers;
```

---

## 📤 Events

### `Settled`

```solidity
event Settled(
    address indexed token,
    address indexed merchant,
    address indexed treasury,
    uint256 merchantAmount,
    uint256 feeAmount,
    uint256 reserveAmount,
    uint256 timestamp
);
```

Used for:

- reconciliation
- accounting
- auditing
- dispute resolution

---

## ⛽ Gas Cost (Approx.)

| Type             | Gas     |
| ---------------- | ------- |
| ETH settlement   | ~40k    |
| ERC20 settlement | ~60–75k |

On Base mainnet, typical cost is **<$0.05 per settlement**.

---

## 🚫 What This Contract Does NOT Do

- ❌ No automatic balance sweeping
- ❌ No on-chain merchant registry
- ❌ No fee configuration storage
- ❌ No price or oracle logic
- ❌ No custody or escrow

All of the above belong off-chain.

---

## 🛠 Deployment

This contract is designed to be deployed **once per network**.

Example supported networks:

- Base
- Base Sepolia
- BSC
- BSC Testnet

Deployment artifacts are tracked via Hardhat Ignition.

---

## 🧪 Testing & Settlement Flow

1. PSP / Ramp sends funds to PayForwarder
2. Off-chain system computes:
   - settlement amount
   - feeBps / reserveBps

3. Authorized executor calls `forward`
4. Funds are split and transferred atomically
5. `Settled` event emitted

---

## 🧩 Example Settlement (USDC)

```json
{
  "token": "0xUSDC",
  "merchant": "0xMerchant",
  "treasury": "0xTreasury",
  "amount": "94568900",
  "feeBps": 300,
  "reserveBps": 500
}
```

---

## 📄 License

MIT
