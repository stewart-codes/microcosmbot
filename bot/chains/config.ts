import { Bech32Address } from '@keplr-wallet/cosmos'
import { Bech32Config, ChainInfo } from '@keplr-wallet/types'

export interface ChainInfoWithExplorer extends ChainInfo {
  // Formed as "https://explorer.com/{txHash}"
  useChainName: string
}
export interface ChainInfoNew {
  rpc: string
  rest: string
  chainId: string
  chainName: string
  useChainName: string
  bech32Prefix: string
}

export const ChainInfos: ChainInfoNew[] = [
  {
    rpc: 'https://rpc.stargaze-apis.com',
    rest: 'https://rest.stargaze-apis.com',
    chainId: 'stargaze-1',
    useChainName: 'stargaze',
    chainName: 'Stargaze',
    // stakeCurrency: {
    //   coinDenom: 'STARS',
    //   coinMinimalDenom: 'ustars',
    //   coinDecimals: 6,
    //   coinGeckoId: 'stars',
    //   coinImageUrl: 'https://stargaze.zone/logo.png',
    // },
    // bip44: {
    //   coinType: 118,
    // },
    bech32Prefix: 'stars',
    // currencies: [
    //   {
    //     coinDenom: 'STARS',
    //     coinMinimalDenom: 'ustars',
    //     coinDecimals: 6,
    //     coinGeckoId: 'stars',
    //     coinImageUrl: 'https://stargaze.zone/logo.png',
    //   },
    // ],
    // feeCurrencies: [
    //   {
    //     coinDenom: 'STARS',
    //     coinMinimalDenom: 'ustars',
    //     coinDecimals: 6,
    //     coinGeckoId: 'stargaze',
    //     coinImageUrl: 'https://stargaze.zone/logo.png',
    //   },
    // ],
    // features: ['stargate', 'ibc-transfer', 'no-legacy-stdTx'],
  },
  // {
  //   rpc: 'https://rpc.elgafar-1.stargaze-apis.com/',
  //   rest: 'https://rest.elgafar-1.stargaze-apis.com/',
  //   chainId: 'elgafar-1',
  //   chainName: 'Stargaze Testnet',
  //   useChainName: 'stargazetest',
  //   // stakeCurrency: {
  //   //   coinDenom: 'STARS',
  //   //   coinMinimalDenom: 'ustars',
  //   //   coinDecimals: 6,
  //   //   coinGeckoId: 'stars',
  //   //   coinImageUrl: 'https://stargaze.zone/logo.png',
  //   // },
  //   // bip44: {
  //   //   coinType: 118,
  //   // },
  //   bech32Config: Bech32Address.defaultBech32Config('stars'),
  //   // currencies: [
  //   //   {
  //   //     coinDenom: 'STARS',
  //   //     coinMinimalDenom: 'ustars',
  //   //     coinDecimals: 6,
  //   //     coinGeckoId: 'stars',
  //   //     coinImageUrl: 'https://stargaze.zone/logo.png',
  //   //   },
  //   // ],
  //   // feeCurrencies: [
  //   //   {
  //   //     coinDenom: 'STARS',
  //   //     coinMinimalDenom: 'ustars',
  //   //     coinDecimals: 6,
  //   //     coinGeckoId: 'stargaze',
  //   //     coinImageUrl: 'https://stargaze.zone/logo.png',
  //   //   },
  //   // ],
  //   // features: ['stargate', 'ibc-transfer', 'no-legacy-stdTx'],
  // },
  {
    useChainName: 'neutron',
    chainName: 'Neutron',
    chainId: 'neutron-1',
    bech32Prefix: 'neutron',
    // "staking": {
    //   "staking_tokens": [
    //     {
    //       "denom": "untrn"
    //     }
    //   ]
    // },

    // "logo_URIs": {
    //   "png": "https://raw.githubusercontent.com/cosmos/chain-registry/master/neutron/images/neutron-black-logo.png",
    //   "svg": "https://raw.githubusercontent.com/cosmos/chain-registry/master/neutron/images/neutron-black-logo.svg"
    // },
    // "description": "The most secure CosmWasm platform in Cosmos, Neutron lets smart-contracts leverage bleeding-edge Interchain technology with minimal overhead.",
    rest: 'https://api-neutron.cosmos-spaces.cloud',
    rpc: 'https://rpc-neutron.cosmos-spaces.cloud',
    // "apis": {
    //   "rpc": [
    //     {
    //       "address": "https://rpc.novel.remedy.tm.p2p.org",
    //       "provider": "P2P"
    //     },
    //     {
    //       "address": "https://neutron-rpc.lavenderfive.com",
    //       "provider": "Lavender.Five Nodes 🐝"
    //     },
    //     {
    //       "address": "https://rpc-neutron.whispernode.com",
    //       "provider": "WhisperNode 🤐"
    //     },
    //     {
    //       "address": "https://rpc-neutron.cosmos-spaces.cloud",
    //       "provider": "Cosmos Spaces"
    //     },
    //     {
    //       "address": "http://rpc.neutron.nodestake.top",
    //       "provider": "NodeStake"
    //     },
    //     {
    //       "address": "https://neutron-rpc.publicnode.com:443",
    //       "provider": "Allnodes ⚡️ Nodes & Staking"
    //     },
    //     {
    //       "address": "https://community.nuxian-node.ch:6797/neutron/trpc",
    //       "provider": "PRO Delegators"
    //     },
    //     {
    //       "address": "https://rpc.neutron.bronbro.io:443",
    //       "provider": "Bro_n_Bro"
    //     }
    //   ],
    //   "rest": [
    //     {
    //       "address": "https://api.novel.remedy.tm.p2p.org",
    //       "provider": "P2P"
    //     },
    //     {
    //       "address": "https://neutron-api.lavenderfive.com",
    //       "provider": "Lavender.Five Nodes 🐝"
    //     },
    //     {
    //       "address": "https://lcd-neutron.whispernode.com",
    //       "provider": "WhisperNode 🤐"
    //     },
    //     {
    //       "address": "https://api-neutron.cosmos-spaces.cloud",
    //       "provider": "Cosmos Spaces"
    //     },
    //     {
    //       "address": "http://api.neutron.nodestake.top",
    //       "provider": "NodeStake"
    //     },
    //     {
    //       "address": "https://neutron-rest.publicnode.com",
    //       "provider": "Allnodes ⚡️ Nodes & Staking"
    //     },
    //     {
    //       "address": "https://community.nuxian-node.ch:6797/neutron/crpc",
    //       "provider": "PRO Delegators"
    //     },
    //     {
    //       "address": "https://lcd.neutron.bronbro.io:443",
    //       "provider": "Bro_n_Bro"
    //     }
    //   ],
    //   "grpc": [
    //     {
    //       "address": "grpc-kralum.neutron-1.neutron.org:80",
    //       "provider": "Neutron"
    //     },
    //     {
    //       "address": "neutron-grpc-pub.rpc.p2p.world:3001",
    //       "provider": "P2P"
    //     },
    //     {
    //       "address": "neutron-grpc.lavenderfive.com:443",
    //       "provider": "Lavender.Five Nodes 🐝"
    //     },
    //     {
    //       "address": "grpc-neutron.whispernode.com:443",
    //       "provider": "WhisperNode 🤐"
    //     },
    //     {
    //       "address": "grpc-neutron.cosmos-spaces.cloud:3090",
    //       "provider": "Cosmos Spaces"
    //     },
    //     {
    //       "address": "grpc.neutron.nodestake.top:9090",
    //       "provider": "NodeStake"
    //     },
    //     {
    //       "address": "neutron-grpc.publicnode.com:443",
    //       "provider": "Allnodes ⚡️ Nodes & Staking"
    //     },
    //     {
    //       "address": "https://grpc.neutron.bronbro.io:443",
    //       "provider": "Bro_n_Bro"
    //     }
    //   ]
    // },

    // images: [
    //   {
    //     png: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/neutron/images/neutron-black-logo.png',
    //     svg: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/neutron/images/neutron-black-logo.svg',
    //   },
    // ],
  },
  {
    rpc: 'https://cosmos-rpc.publicnode.com:443',
    rest: 'https://cosmos-rest.publicnode.com',
    chainId: 'cosmoshub-4',
    chainName: 'Cosmos Hub',
    useChainName: 'cosmoshub',
    bech32Prefix: 'cosmos',
  },
]
