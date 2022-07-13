import { CustomErc20Token, TokenId } from "@core/domains/tokens/types"
import { AnyEthRequest, EthProviderMessage, EthResponseTypes } from "@core/injectEth/types"
import { RequestIdOnly } from "@core/types/base"

import { AddEthereumChainParameter, WatchAssetBase } from "./base"

export type { AddEthereumChainParameter, WatchAssetBase }

export declare type EthApproveSignAndSend = RequestIdOnly & {
  maxPriorityFeePerGas: string
  maxFeePerGas: string
}
export interface AnyEthRequestChainId extends AnyEthRequest {
  chainId: number
}

export type WatchAssetRequest = {
  request: WatchAssetBase
  token: CustomErc20Token
  id: string
  url: string
}

export type EthereumRpc = {
  url: string // The url of this ethereum RPC
  isHealthy: boolean // The health status of this ethereum RPC
}

export type EvmNetworkId = number
export type EvmNetwork = {
  id: EvmNetworkId
  isTestnet: boolean
  sortIndex: number | null
  name: string | null
  // TODO: Create ethereum tokens store (and reference here by id).
  //       Or extend substrate tokens store to support both substrate and ethereum tokens.
  nativeToken: { id: TokenId } | null
  tokens: Array<{ id: TokenId }> | null
  explorerUrl: string | null
  rpcs: Array<EthereumRpc> | null
  isHealthy: boolean
  substrateChain: { id: EvmNetworkId } | null
}
export type CustomEvmNetwork = EvmNetwork & {
  isCustom: true
  explorerUrls: string[]
  iconUrls: string[]
}

export type EvmNetworkList = Record<EvmNetworkId, EvmNetwork | CustomEvmNetwork>

// ethereum networks

export type AddEthereumChainRequest = {
  id: string
  idStr: string
  url: string
  network: AddEthereumChainParameter
}

export interface EthMessages {
  // all ethereum calls
  "pub(eth.request)": [AnyEthRequest, EthResponseTypes]
  "pub(eth.subscribe)": [null, boolean, EthProviderMessage]
  "pub(eth.mimicMetaMask)": [null, boolean]
  // eth signing message signatures
  "pri(eth.request)": [AnyEthRequestChainId, EthResponseTypes]
  "pri(eth.signing.cancel)": [RequestIdOnly, boolean]
  "pri(eth.signing.approveSign)": [RequestIdOnly, boolean]
  "pri(eth.signing.approveSignAndSend)": [EthApproveSignAndSend, boolean]
  // eth add networks requests management
  // TODO change naming for network add requests, and maybe delete the first one
  "pri(eth.networks.add.requests)": [null, AddEthereumChainRequest[]]
  "pri(eth.networks.add.approve)": [RequestIdOnly, boolean]
  "pri(eth.networks.add.cancel)": [RequestIdOnly, boolean]
  "pri(eth.networks.add.subscribe)": [null, boolean, AddEthereumChainRequest[]]
  // eth watchassets requests  management
  "pri(eth.watchasset.requests.approve)": [RequestIdOnly, boolean]
  "pri(eth.watchasset.requests.cancel)": [RequestIdOnly, boolean]
  "pri(eth.watchasset.requests.subscribe)": [null, boolean, WatchAssetRequest[]]
  "pri(eth.watchasset.requests.subscribe.byid)": [RequestIdOnly, boolean, WatchAssetRequest]

  // ethereum networks message signatures
  "pri(eth.networks.subscribe)": [null, boolean, boolean]
  "pri(eth.networks.add.custom)": [CustomEvmNetwork, boolean]
  "pri(eth.networks.removeCustomNetwork)": [RequestIdOnly, boolean]
  "pri(eth.networks.clearCustomNetworks)": [null, boolean]
}