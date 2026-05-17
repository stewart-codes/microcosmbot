import { describe, it, expect } from 'vitest'
import { toBech32 } from 'cosmwasm'
import {
  isStarAddress,
  zodStarsAddress,
  zodStarsContractAddress,
} from '../../libs/stars'

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
