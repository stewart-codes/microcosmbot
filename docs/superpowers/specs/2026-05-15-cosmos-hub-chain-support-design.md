# Design: Cosmos Hub (cosmoshub-4) Chain Support

**Date:** 2026-05-15  
**Branch:** self-host  
**Scope:** Add Cosmos Hub as a supported blockchain type so Telegram groups can be token-gated by ATOM and Cosmos Hub CosmWasm assets.

---

## Problem

Microcosms supports `stargaze-1` and `neutron-1`. Users want to create Telegram groups gated by Cosmos Hub assets (ATOM balance, staking delegations, and CosmWasm NFTs/DAOs on cosmoshub-4, which now supports CosmWasm).

---

## Approach

Option A — minimal chain config addition. Add `cosmoshub-4` to `ChainInfos`, extend bech32 prefix acceptance to include `cosmos`, and make contract address validation chain-aware. No schema migration, no new enum values, no frontend-specific changes beyond what already derives from `ChainInfos`.

---

## Architecture

The chain layer is already fully abstracted:

- `bot/chains/config.ts` — `ChainInfos` array; all chain lookup goes through `getChainInfo(chainId)`
- `bot/operations/token-ownership/nft-ownership.ts` — `fetchRest()` routes all REST calls through `getChainInfo(chainId).rest`
- `bot/operations/access/access-rules.ts` — `getChainIdFromWallet()` matches wallets to chains by bech32 prefix
- `components/ManageGroup.tsx` — chain dropdown is generated dynamically from `ChainInfos`

Adding a new chain entry propagates automatically through all of these.

---

## Changes

### 1. `bot/chains/config.ts`

Add to `ChainInfos`:

```ts
{
  rpc: 'https://cosmos-rpc.publicnode.com:443',
  rest: 'https://cosmos-rest.publicnode.com',
  chainId: 'cosmoshub-4',
  chainName: 'Cosmos Hub',
  useChainName: 'cosmoshub',
  bech32Prefix: 'cosmos',
}
```

### 2. `libs/stars.ts`

Expand `compatiblePrefixes` from `['stars']` to `['stars', 'cosmos', 'neutron']`.

This makes `toStars()` / `isStarAddress()` accept Cosmos Hub and Neutron wallet addresses in addition to Stargaze. The function name (`toStars`) is a historical artifact; the logic is generic bech32 validation.

### 3. `server/routers/manage-group.ts`

The `getDaoDaoInfo` procedure uses `zodStarsContractAddress` which validates that a contract address uses the `stars` bech32 prefix. Cosmos Hub contract addresses use the `cosmos` prefix instead.

Fix: look up the group's `chainId` from the DB (already available via `getGroupForCode`), then derive the expected bech32 prefix from `getChainInfo(chainId).bech32Prefix` and validate the contract address against that prefix rather than hardcoding `stars`.

---

## Data Flow

No changes to the database schema. The `Group.chainId` field already stores any chain ID string. The `GroupTokenGate.contractAddress` field is a plain `String` and already accepts any bech32 address format.

When a group admin sets their group's chain to `cosmoshub-4` via the UI's chain dropdown, the `setChain` mutation validates the chain ID against `ChainInfos` (already implemented) and persists it. Subsequent wallet verification and token ownership checks route to Cosmos Hub's REST endpoint automatically.

---

## Rule Types on Cosmos Hub

All three existing rule types work on cosmoshub-4:

| Rule Type | Mechanism | Works on Cosmos Hub |
|-----------|-----------|---------------------|
| `SG721` | CosmWasm CW721 query via REST | Yes (CosmWasm now enabled) |
| `DAO_DAO` | CosmWasm contract query | Yes |
| `TOKEN_FACTORY` | `/cosmos/bank/v1beta1/balances` + `/cosmos/staking/v1beta1/delegations` | Yes (native ATOM) |

No filtering of rule types per chain is needed.

---

## What is NOT in scope

- Adding a new `NATIVE_TOKEN` rule type (deferred; TOKEN_FACTORY already works)
- Per-chain rule type filtering in the UI
- Environment-variable-driven endpoint configuration
- Stargaze RPC/REST endpoint changes

---

## Testing

- Add `cosmoshub-4` to ChainInfos and verify `getChainInfo('cosmoshub-4')` returns the entry
- Verify a `cosmos1...` wallet address passes `isStarAddress()` after prefix expansion
- Verify the manage-group UI chain dropdown shows "Cosmos Hub"
- Verify `setChain` mutation accepts `cosmoshub-4`
- Verify `getDaoDaoInfo` accepts a `cosmos1...` contract address when the group is on `cosmoshub-4`
- Manually test token balance check against a known Cosmos Hub wallet
