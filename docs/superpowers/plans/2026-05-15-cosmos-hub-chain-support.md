# Cosmos Hub Chain Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Cosmos Hub (`cosmoshub-4`) as a supported blockchain type so Telegram groups can be token-gated by ATOM and Cosmos Hub CosmWasm assets.

**Architecture:** Add a `cosmoshub-4` entry to the `ChainInfos` array (the single source of truth for supported chains). Fix the bech32 address validators in `libs/stars.ts` to remove hardcoded `stars`-only length checks so they accept any supported chain prefix. Add runtime chain-prefix validation in the `getDaoDaoInfo` tRPC procedure so contract addresses are validated against the group's actual chain.

**Tech Stack:** TypeScript, Vitest, Zod, CosmWasm bech32 encoding (`cosmwasm` npm package), Prisma, tRPC

---

## File Map

| File | Change |
|------|--------|
| `bot/chains/config.ts` | Add `cosmoshub-4` entry to `ChainInfos` |
| `libs/stars.ts` | Add `'cosmos'` + `'neutron'` to `compatiblePrefixes`; remove hardcoded length checks from `zodStarsAddress` and `zodStarsContractAddress` |
| `server/routers/manage-group.ts` | Add runtime chain-prefix validation in `getDaoDaoInfo` |
| `__tests__/chains/config.test.ts` | New — tests for chain config lookup |
| `__tests__/libs/stars.test.ts` | New — tests for multi-chain address validation |

---

### Task 1: Add cosmoshub-4 to ChainInfos

**Files:**
- Modify: `bot/chains/config.ts`
- Create: `__tests__/chains/config.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/chains/config.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { ChainInfos } from '../bot/chains/config'
import { getChainInfo } from '../bot/chains/ChainInfo'

describe('getChainInfo', () => {
  it('returns cosmoshub-4 chain info', () => {
    const chain = getChainInfo('cosmoshub-4')
    expect(chain).toBeDefined()
    expect(chain?.chainId).toBe('cosmoshub-4')
    expect(chain?.chainName).toBe('Cosmos Hub')
    expect(chain?.useChainName).toBe('cosmoshub')
    expect(chain?.bech32Prefix).toBe('cosmos')
    expect(chain?.rpc).toBe('https://cosmos-rpc.publicnode.com:443')
    expect(chain?.rest).toBe('https://cosmos-rest.publicnode.com')
  })

  it('still returns stargaze-1', () => {
    const chain = getChainInfo('stargaze-1')
    expect(chain).toBeDefined()
    expect(chain?.bech32Prefix).toBe('stars')
  })

  it('returns undefined for unknown chain', () => {
    expect(getChainInfo('unknown-chain')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run __tests__/chains/config.test.ts
```

Expected: FAIL — `getChainInfo('cosmoshub-4')` returns `undefined`.

- [ ] **Step 3: Add cosmoshub-4 to ChainInfos**

In `bot/chains/config.ts`, append to the `ChainInfos` array (after the `neutron-1` entry):

```ts
  {
    rpc: 'https://cosmos-rpc.publicnode.com:443',
    rest: 'https://cosmos-rest.publicnode.com',
    chainId: 'cosmoshub-4',
    chainName: 'Cosmos Hub',
    useChainName: 'cosmoshub',
    bech32Prefix: 'cosmos',
  },
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx vitest run __tests__/chains/config.test.ts
```

Expected: PASS — all 3 assertions green.

- [ ] **Step 5: Commit**

```bash
git add bot/chains/config.ts __tests__/chains/config.test.ts
git commit -m "feat: add cosmoshub-4 to supported chains"
```

---

### Task 2: Extend bech32 prefix support and fix length validators

**Context:** `libs/stars.ts` defines two validators:
- `zodStarsAddress` — `.length(44)` (exact char length for a `stars1...` wallet address). A `cosmos1...` wallet address is 45 chars, `neutron1...` is 46 chars, so this length check rejects them.
- `zodStarsContractAddress` — `.length(64)` (exact char length for a `stars1...` contract address). A `cosmos1...` contract address is 65 chars, so this rejects it too.

The underlying `.refine()` call uses `isStarAddress()` which already correctly validates via bech32 decoding (checking the prefix is in `compatiblePrefixes` and the data is 20 or 32 bytes). The hardcoded string length checks are redundant and chain-specific — removing them makes the validators work for any supported chain.

`zodStarsContractAddress` is imported in `server/update-schema.ts`, `server/routers/manage-group.ts`, and `components/views/EditOrCreateGroupTokenGateView.tsx`. Fixing it in `libs/stars.ts` propagates the fix to all three.

**Files:**
- Modify: `libs/stars.ts`
- Create: `__tests__/libs/stars.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/libs/stars.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { toBech32 } from 'cosmwasm'
import {
  isStarAddress,
  zodStarsAddress,
  zodStarsContractAddress,
} from '../libs/stars'

// Deterministic test addresses using well-known byte patterns
const starsWallet   = toBech32('stars',   new Uint8Array(20).fill(1)) // 44 chars
const cosmosWallet  = toBech32('cosmos',  new Uint8Array(20).fill(1)) // 45 chars
const neutronWallet = toBech32('neutron', new Uint8Array(20).fill(1)) // 46 chars
const starsContract   = toBech32('stars',  new Uint8Array(32).fill(1)) // 64 chars
const cosmosContract  = toBech32('cosmos', new Uint8Array(32).fill(1)) // 65 chars

describe('isStarAddress', () => {
  it('accepts stars wallet addresses', () => {
    expect(isStarAddress(starsWallet)).toBe(true)
  })

  it('accepts cosmos wallet addresses', () => {
    expect(isStarAddress(cosmosWallet)).toBe(true)
  })

  it('accepts neutron wallet addresses', () => {
    expect(isStarAddress(neutronWallet)).toBe(true)
  })

  it('rejects unknown prefix addresses', () => {
    const ethAddr = toBech32('eth', new Uint8Array(20).fill(1))
    expect(isStarAddress(ethAddr)).toBe(false)
  })
})

describe('zodStarsAddress', () => {
  it('accepts stars wallet address', () => {
    expect(zodStarsAddress.safeParse(starsWallet).success).toBe(true)
  })

  it('accepts cosmos wallet address', () => {
    expect(zodStarsAddress.safeParse(cosmosWallet).success).toBe(true)
  })

  it('accepts neutron wallet address', () => {
    expect(zodStarsAddress.safeParse(neutronWallet).success).toBe(true)
  })

  it('rejects garbage string', () => {
    expect(zodStarsAddress.safeParse('notanaddress').success).toBe(false)
  })
})

describe('zodStarsContractAddress', () => {
  it('accepts stars contract address', () => {
    expect(zodStarsContractAddress.safeParse(starsContract).success).toBe(true)
  })

  it('accepts cosmos contract address', () => {
    expect(zodStarsContractAddress.safeParse(cosmosContract).success).toBe(true)
  })

  it('rejects a wallet address (20 bytes, not 32)', () => {
    expect(zodStarsContractAddress.safeParse(cosmosWallet).success).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run __tests__/libs/stars.test.ts
```

Expected: FAIL — `isStarAddress(cosmosWallet)` returns `false` because `'cosmos'` is not in `compatiblePrefixes`; `zodStarsAddress.safeParse(cosmosWallet)` fails because `.length(44)` rejects 45-char addresses.

- [ ] **Step 3: Update libs/stars.ts**

Open `libs/stars.ts`. Make three changes:

**Change 1** — expand `compatiblePrefixes` (line 23):
```ts
const compatiblePrefixes = ['stars', 'cosmos', 'neutron']
```

**Change 2** — remove the hardcoded `.length(44)` from `zodStarsAddress`. The validator should be:
```ts
export const zodStarsAddress = z
  .string()
  .refine((val) => isStarAddress(val), 'Invalid stars address')
```

**Change 3** — update `zodStarsContractAddress` to validate 32-byte data (contract address) without relying on fixed string length. The validator must reject 20-byte wallet addresses while accepting 32-byte contract addresses:
```ts
export const zodStarsContractAddress = z
  .string()
  .refine((val) => {
    try {
      const { prefix, data } = fromBech32(val)
      return compatiblePrefixes.includes(prefix) && data.length === 32
    } catch {
      return false
    }
  }, 'Invalid contract address')
```

Note: `fromBech32` is already imported at the top of the file from `'cosmwasm'`.

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run __tests__/libs/stars.test.ts
```

Expected: PASS — all assertions green.

- [ ] **Step 5: Commit**

```bash
git add libs/stars.ts __tests__/libs/stars.test.ts
git commit -m "feat: extend bech32 prefix support to cosmos and neutron chains"
```

---

### Task 3: Add runtime chain-prefix validation in getDaoDaoInfo

**Context:** The `getDaoDaoInfo` tRPC procedure in `server/routers/manage-group.ts` accepts a `contractAddress` input. After Task 2, the Zod schema now accepts any valid contract address from any supported chain. However, we should also validate at runtime that the contract address prefix matches the group's chain — e.g., a Cosmos Hub group should not accept a `stars1...` contract address.

The group is already fetched via `getGroupForCode(input.code)`. The `getChainInfo` function is already imported. We need to add `fromBech32` from `'cosmwasm'` to decode the input address's prefix, and compare it to the expected prefix for the group's chain.

**Files:**
- Modify: `server/routers/manage-group.ts`

- [ ] **Step 1: Add the import for fromBech32**

In `server/routers/manage-group.ts`, add the following import at the top of the file (alongside the existing imports):

```ts
import { fromBech32 } from 'cosmwasm'
```

- [ ] **Step 2: Add runtime prefix validation inside getDaoDaoInfo**

Locate the `getDaoDaoInfo` procedure handler. After the `getGroupForCode` call and null-check, add prefix validation before calling `getDaoDaoContractAndNft`. The updated handler body should look like this:

```ts
const getDaoDaoInfo = procedure
  .input(
    z.object({
      code: z.string(),
      contractAddress: zodStarsContractAddress,
    })
  )

  .query(async ({ input, ctx }) => {
    if (!input.contractAddress) {
      throw new TRPCError({ code: 'NOT_FOUND' })
    }
    const group = await getGroupForCode(input.code)
    if (!group) {
      console.log('group not found', input.code)
      throw new TRPCError({ code: 'NOT_FOUND' })
    }

    // Validate contract address prefix matches the group's chain
    const chainInfo = getChainInfo(group.group.chainId)
    if (!chainInfo) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'invalid chain' })
    }
    const { prefix } = fromBech32(input.contractAddress)
    if (prefix !== chainInfo.bech32Prefix) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `contract address prefix '${prefix}' does not match chain prefix '${chainInfo.bech32Prefix}'`,
      })
    }

    const daodaoinfo = await getDaoDaoContractAndNft(
      group.group.chainId,
      input.contractAddress
    )
    if (!daodaoinfo.ok) {
      return {
        ok: false,
        error: daodaoinfo.error.toString(),
      }
    }
    return { ok: true, daoDaoInfo: daodaoinfo.value }
  })
```

- [ ] **Step 3: Check TypeScript compiles without errors**

```bash
npx tsc --noEmit
```

Expected: No errors. If you see errors, they are most likely missing `fromBech32` import or a type mismatch — fix them before proceeding.

- [ ] **Step 4: Run the full test suite to confirm nothing is broken**

```bash
npx vitest run
```

Expected: All tests pass including the new ones from Tasks 1 and 2.

- [ ] **Step 5: Commit**

```bash
git add server/routers/manage-group.ts
git commit -m "feat: add runtime chain-prefix validation for contract addresses in getDaoDaoInfo"
```

---

## Manual Verification Checklist

After all tasks are committed:

- [ ] Start the dev server: `pnpm dev`
- [ ] Navigate to a manage-group page in the browser
- [ ] Confirm the chain dropdown now shows **Cosmos Hub** as an option alongside Stargaze and Neutron
- [ ] Switch a test group's chain to Cosmos Hub via the dropdown — confirm the `setChain` mutation succeeds
- [ ] In the add-rule modal for a Cosmos Hub group, enter a `cosmos1...` contract address — confirm it passes frontend validation (the `zodStarsContractAddress` validator in the form schema now accepts it)
- [ ] Confirm a `stars1...` contract address is rejected when the group is on Cosmos Hub (the `getDaoDaoInfo` endpoint throws BAD_REQUEST)
