import { Balances } from "@core/domains/balances/types"
import { Token, TokenId } from "@core/domains/tokens/types"
import { Address } from "@core/types/base"
import { isEthereumAddress } from "@polkadot/util-crypto"
import { ScrollContainer } from "@talisman/components/ScrollContainer"
import { SearchInput } from "@talisman/components/SearchInput"
import { CheckCircleIcon } from "@talisman/theme/icons"
import { classNames, planckToTokens } from "@talismn/util"
import useAccountByAddress from "@ui/hooks/useAccountByAddress"
import useBalances from "@ui/hooks/useBalances"
import useChains from "@ui/hooks/useChains"
import { useEvmNetworks } from "@ui/hooks/useEvmNetworks"
import { useSetting } from "@ui/hooks/useSettings"
import { useTokenRatesMap } from "@ui/hooks/useTokenRatesMap"
import useTokens from "@ui/hooks/useTokens"
import { isTransferableToken } from "@ui/util/isTransferableToken"
import sortBy from "lodash/sortBy"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { FC } from "react"
import { useIntersection } from "react-use"

import { ChainLogoBase } from "./ChainLogo"
import Fiat from "./Fiat"
import { TokenLogo } from "./TokenLogo"
import Tokens from "./Tokens"

const filterIgnoredTokens = (t: Token) => {
  // on substrate, there could be multiple tokens with same symbol on a same chain (ACA, KINT..)
  // a good fix would be to detect on subsquid side if ANY account has tokens, if not the token shouldn't be included in github tokens file
  // until then we hardcode an exclusion list here :

  // ACA, BNC and KAR use native (orml won't work)
  // INTR, KINT and MGX use orml (native won't work)

  const IGNORED_TOKENS = [
    "acala-substrate-orml-aca",
    "bifrost-kusama-substrate-orml-bnc",
    "bifrost-polkadot-substrate-orml-bnc",
    "interlay-substrate-native-intr",
    "karura-substrate-orml-kar",
    "kintsugi-substrate-native-kint",
    "mangata-substrate-native-mgx",
  ]

  return !IGNORED_TOKENS.includes(t.id)
}

type TokenRowProps = {
  token: Token
  selected: boolean
  onClick?: () => void
  balances: Balances
  chainName?: string | null
  chainLogo?: string | null
  hasFiatRate?: boolean
  allowUntransferable?: boolean
}

const TokenRowSkeleton = () => (
  <div className="flex h-[5.8rem] w-full items-center gap-4 px-12 text-left">
    <div className="bg-grey-750 h-16 w-16 animate-pulse rounded-full"></div>
    <div className="grow space-y-[5px]">
      <div className={"text-body flex w-full justify-between text-sm font-bold"}>
        <div>
          <div className="bg-grey-750 rounded-xs inline-block h-7 w-20 animate-pulse"></div>
        </div>
        <div>
          <div className="bg-grey-750 rounded-xs inline-block h-7 w-48 animate-pulse"></div>
        </div>
      </div>
      <div className="text-body-secondary flex w-full items-center justify-between gap-2 text-right text-xs font-light">
        <div>
          <div className="bg-grey-800 rounded-xs inline-block h-6 w-40 animate-pulse"></div>
        </div>
        <div className="grow text-right">
          <div className="bg-grey-800 rounded-xs inline-block h-6 w-28 animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
)

const TokenRow: FC<TokenRowProps> = ({
  token,
  selected,
  balances,
  chainName,
  chainLogo,
  hasFiatRate,
  allowUntransferable,
  onClick,
}) => {
  const { tokensTotal, isLoading } = useMemo(() => {
    const planck = balances.each.reduce((prev, curr) => prev + curr.transferable.planck, 0n)
    return {
      tokensTotal: planckToTokens(planck.toString(), token.decimals),
      isLoading: balances.each.find((b) => b.status === "cache"),
    }
  }, [balances.each, token.decimals])

  const isTransferable = useMemo(() => isTransferableToken(token), [token])

  // there are more than 250 tokens so we should render only visible tokens to prevent performance issues
  const refButton = useRef<HTMLButtonElement>(null)
  const intersection = useIntersection(refButton, {
    root: null,
    rootMargin: "1000px",
  })

  return (
    <button
      ref={refButton}
      disabled={!allowUntransferable && !isTransferable}
      title={
        allowUntransferable || isTransferable
          ? undefined
          : "Sending this token is not supported yet"
      }
      type="button"
      data-id={token.id}
      onClick={onClick}
      tabIndex={0}
      className={classNames(
        "hover:bg-grey-750 focus:bg-grey-700 flex h-[5.8rem] w-full items-center gap-4 px-12 text-left",
        "disabled:cursor-not-allowed disabled:opacity-50",
        selected && "bg-grey-800 text-body-secondary"
      )}
    >
      {intersection?.isIntersecting && (
        <>
          <div className="w-16 shrink-0">
            <TokenLogo tokenId={token.id} className="!text-xl" />
          </div>
          <div className="grow space-y-[5px]">
            <div
              className={classNames(
                "flex w-full justify-between text-sm font-bold",
                selected ? "text-body-secondary" : "text-body"
              )}
            >
              <div>
                {token.symbol}
                {selected && <CheckCircleIcon className="ml-3 inline align-text-top" />}
              </div>
              <div className={classNames(isLoading && "animate-pulse")}>
                <Tokens
                  amount={tokensTotal}
                  decimals={token.decimals}
                  symbol={token.symbol}
                  isBalance
                  noCountUp
                />
              </div>
            </div>
            <div className="text-body-secondary flex w-full items-center justify-between gap-2 text-right text-xs font-light">
              <div className="flex flex-col justify-center">
                <ChainLogoBase
                  logo={chainLogo}
                  name={chainName ?? ""}
                  className="inline-block text-sm"
                />
              </div>
              <div>{chainName}</div>
              <div className={classNames("grow", isLoading && "animate-pulse")}>
                {hasFiatRate ? (
                  <Fiat
                    amount={balances.sum.fiat("usd").transferable}
                    currency="usd"
                    isBalance
                    noCountUp
                  />
                ) : (
                  "-"
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </button>
  )
}

type TokensListProps = {
  address?: Address
  networkType?: TokenNetworkType
  selected?: TokenId
  search?: string
  showEmptyBalances?: boolean
  allowUntransferable?: boolean
  onSelect?: (tokenId: TokenId) => void
}

const TokensList: FC<TokensListProps> = ({
  address,
  selected,
  search,
  networkType,
  showEmptyBalances,
  allowUntransferable,
  onSelect,
}) => {
  const account = useAccountByAddress(address)
  const [useTestnets] = useSetting("useTestnets")
  const { chainsMap, chains } = useChains(useTestnets)
  const { evmNetworksMap } = useEvmNetworks(useTestnets)
  const { tokens: allTokens } = useTokens(useTestnets)
  const tokenRatesMap = useTokenRatesMap()

  const balances = useBalances()

  const accountBalances = useMemo(
    () => (address && !selected ? balances.find({ address: address ?? undefined }) : balances),
    [address, selected, balances]
  )

  const accountChain = useMemo(
    () => account?.genesisHash && chains.find((c) => c.genesisHash === account?.genesisHash),
    [account?.genesisHash, chains]
  )

  const filterAccountCompatibleTokens = useCallback(
    (token: Token) => {
      if ((!account && !networkType) || selected) return true
      if (accountChain) return token.chain?.id === accountChain.id
      if (networkType) return networkType === "ethereum" ? !!token.evmNetwork : !!token.chain
      return isEthereumAddress(address) ? !!token.evmNetwork : !!token.chain
    },
    [account, networkType, selected, accountChain, address]
  )

  const accountCompatibleTokens = useMemo(() => {
    // wait until all dependencies are loaded
    if (
      !Object.keys(chainsMap).length ||
      !Object.keys(evmNetworksMap).length ||
      !Object.keys(tokenRatesMap).length
    )
      return []

    return allTokens
      .filter(filterAccountCompatibleTokens)
      .filter(filterIgnoredTokens)
      .map((token) => {
        const chain = token.chain && chainsMap[token.chain.id]
        const evmNetwork = token.evmNetwork && evmNetworksMap[token.evmNetwork.id]
        return {
          id: token.id,
          token,
          chainNameSearch: chain?.name ?? evmNetwork?.name,
          chainName:
            chain?.name ??
            (evmNetwork
              ? `${evmNetwork?.name}${evmNetwork?.substrateChain ? " (Ethereum)" : ""}`
              : ""),
          chainLogo: chain?.logo ?? evmNetwork?.logo,
          hasFiatRate: !!tokenRatesMap[token.id],
        }
      })
  }, [allTokens, chainsMap, evmNetworksMap, filterAccountCompatibleTokens, tokenRatesMap])

  const tokensWithBalances = useMemo(() => {
    // wait until balances are loaded
    if (!accountBalances.count) return []

    // sort alphabetically by symbol + chain name
    const results = sortBy(
      sortBy(
        accountCompatibleTokens
          .map((t) => ({
            ...t,
            balances: accountBalances.find({ tokenId: t.id }),
          }))
          .filter(
            (t) => showEmptyBalances || t.balances.each.find((bal) => bal.transferable.planck > 0n)
          ),
        "chainName"
      ),
      "token.symbol"
    ).sort((a, b) => {
      // transferable tokens first
      const isTransferableA = isTransferableToken(a.token)
      const isTransferableB = isTransferableToken(b.token)
      if (isTransferableA && !isTransferableB) return -1
      if (!isTransferableA && isTransferableB) return 1

      // selected token first
      if (a.id === selected) return -1
      if (b.id === selected) return 1

      // sort by fiat balance
      const aFiat = a.balances.sum.fiat("usd").transferable
      const bFiat = b.balances.sum.fiat("usd").transferable
      if (aFiat > bFiat) return -1
      if (aFiat < bFiat) return 1

      // sort by "has a balance or not" (values don't matter)
      const aHasBalance = !!a.balances.sorted.find((bal) => bal.transferable.planck > 0n)
      const bHasBalance = !!b.balances.sorted.find((bal) => bal.transferable.planck > 0n)
      if (aHasBalance && !bHasBalance) return -1
      if (!aHasBalance && bHasBalance) return 1

      // polkadot and kusama should appear first
      if (a.token.id === "polkadot-substrate-native-dot") return -1
      if (b.token.id === "polkadot-substrate-native-dot") return 1
      if (a.token.id === "kusama-substrate-native-ksm") return -1
      if (b.token.id === "kusama-substrate-native-ksm") return 1

      // keep alphabetical sort
      return 0
    })

    return results
  }, [accountBalances, accountCompatibleTokens, showEmptyBalances, selected])

  // apply user search
  const tokens = useMemo(() => {
    const ls = search?.toLowerCase()
    return tokensWithBalances.filter(
      (t) =>
        !ls ||
        t.token.symbol.toLowerCase().includes(ls) ||
        t.chainNameSearch?.toLowerCase().includes(ls)
    )
  }, [search, tokensWithBalances])

  const handleAccountClick = useCallback(
    (address: string) => () => {
      onSelect?.(address)
    },
    [onSelect]
  )

  return (
    <div className="min-h-full">
      {accountBalances.count ? (
        <>
          {tokens?.map(({ token, balances, chainName, chainLogo, hasFiatRate }) => (
            <TokenRow
              key={token.id}
              selected={token.id === selected}
              token={token}
              balances={balances}
              chainName={chainName}
              chainLogo={chainLogo}
              hasFiatRate={hasFiatRate}
              allowUntransferable={allowUntransferable}
              onClick={handleAccountClick(token.id)}
            />
          ))}
          {!tokens?.length && (
            <div className="text-body-secondary flex h-[5.8rem] w-full items-center px-12 text-left">
              No token matches your search
            </div>
          )}
        </>
      ) : (
        <>
          <TokenRowSkeleton />
          <TokenRowSkeleton />
          <TokenRowSkeleton />
          <TokenRowSkeleton />
          <TokenRowSkeleton />
          <TokenRowSkeleton />
          <TokenRowSkeleton />
          <TokenRowSkeleton />
          <TokenRowSkeleton />
        </>
      )}
    </div>
  )
}

type TokenNetworkType = "polkadot" | "ethereum"

type TokenPickerProps = {
  address?: string
  selected?: TokenId
  networkType?: TokenNetworkType
  showEmptyBalances?: boolean
  allowUntransferable?: boolean
  className?: string
  onSelect?: (tokenId: TokenId) => void
}

export const TokenPicker: FC<TokenPickerProps> = ({
  address,
  selected,
  showEmptyBalances,
  networkType: networkTypeProp,
  allowUntransferable,
  onSelect,
}) => {
  const [search, setSearch] = useState("")
  const [networkType, setNetworkType] = useState<TokenNetworkType | undefined>(networkTypeProp)

  useEffect(() => {
    if (!networkTypeProp && address)
      setNetworkType(isEthereumAddress(address) ? "ethereum" : "polkadot")
  }, [address, networkTypeProp])

  return (
    <div className="flex h-full min-h-full w-full flex-col overflow-hidden">
      <div className="flex min-h-fit w-full items-center gap-8 px-12 pb-8">
        {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
        <SearchInput onChange={setSearch} placeholder="Search by token or network name" autoFocus />
      </div>
      <ScrollContainer className="bg-black-secondary border-grey-700 scrollable h-full w-full grow overflow-x-hidden border-t">
        <TokensList
          networkType={networkType}
          address={address}
          selected={selected}
          search={search}
          showEmptyBalances={showEmptyBalances}
          allowUntransferable={allowUntransferable}
          onSelect={onSelect}
        />
      </ScrollContainer>
    </div>
  )
}