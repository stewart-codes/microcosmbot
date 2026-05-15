import { describe, it, expect } from 'vitest'
import { ChainInfos } from '../../bot/chains/config'
import { getChainInfo } from '../../bot/chains/ChainInfo'

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
