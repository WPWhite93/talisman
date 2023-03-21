import { decodeString } from "@polkadot/react-qr/util"
import { hexToNumber, numberToU8a, u8aConcat, u8aToU8a } from "@polkadot/util"
import QRCodeStyling from "@solana/qr-code-styling"
import { classNames } from "@talismn/util"
import init, { Encoder } from "raptorq"
import { FC, useEffect, useRef, useState } from "react"

// TODO put this in a constants file so it can be shared with components from QrSubstrate
const FRAME_SIZE = 1072
const talismanRedHandSvg =
  `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODIiIGhlaWdodD0iODIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTYyLj` +
  `U3MSA0NS40MjVjLTEuMDMgMS4wMy0yLjgyMi41NjMtMy40MzEtLjc2M2ExLjk4MiAxLjk4MiAwIDAgMS0uMTg1LS44MjlWMjAuOTg5YTUuMDAzIDUuMDAzIDAgMCAwLT` +
  `EwLjAwNSAwdjExLjU2MmMwIC45OTQtMS4wMTcgMS42NjktMS45NjcgMS4zN2ExLjQ1NCAxLjQ1NCAwIDAgMS0xLjAzMi0xLjM2N1YxMy45ODdhNS4wMDMgNS4wMDMgMC` +
  `AwIDAtMTAuMDA1IDB2MTguNTY4YTEuNDU0IDEuNDU0IDAgMCAxLTEuMDM0IDEuMzY3Yy0uOTQ5LjMtMS45NjgtLjM3Ni0xLjk2OC0xLjM3MVYyMC45OWE1LjAwMyA1Lj` +
  `AwMyAwIDAgMC0xMC4wMDUgMHYyMi44NTNjMCAuMjgyLS4wNjQuNTU2LS4xODIuODE0LS41OTYgMS4yOTQtMi4zNDYgMS43NDctMy4zNTUuNzRsLTEuODYxLTEuODYxYT` +
  `UuMDAyIDUuMDAyIDAgMCAwLTcuMDc1IDcuMDc0bDE0LjcwNiAxNC43MDdhMTkuOTc2IDE5Ljk3NiAwIDAgMCAxNS43NzQgNy42OTdjNi4xNDMgMCAxMS42MzgtMi43Nj` +
  `cgMTUuMzEtNy4xMjRsMTUuMjgtMTUuMjhhNS4wMDIgNS4wMDIgMCAwIDAtNy4wNzQtNy4wNzR6TTQwLjk0NSA2NS4wMWM4Ljg0IDAgMTYuMDA3LTEwLjAwNSAxNi4wMD` +
  `ctMTAuMDA1cy03LjE2Ni0xMC4wMDQtMTYuMDA3LTEwLjAwNC0xNi4wMDcgMTAuMDA0LTE2LjAwNyAxMC4wMDRTMzIuMTA1IDY1LjAxIDQwLjk0NSA2NS4wMXoiIGNsaX` +
  `AtcnVsZT0iZXZlbm9kZCIgZmlsbD0iI2ZkNDg0OCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PHBhdGggZD0iTTQ2Ljk0OSA1NS4wMDVhNi4wMDMgNi4wMDMgMCAxIDEtMT` +
  `IuMDA2IDAgNi4wMDMgNi4wMDMgMCAwIDEgMTIuMDA2IDB6IiBmaWxsPSIjZmQ0ODQ4Ii8+PC9zdmc+`

// This component uses raptorq wasm library (250ko) to generate the QR code, import only if necessary
// spec here : https://github.com/varovainen/parity-signer/blob/2022-05-25-uos/docs/src/development/UOS.md
const RaptorQrCode: FC<{ data?: Uint8Array }> = ({ data }) => {
  const [totalFramesCount, setTotalFramesCount] = useState<number>()

  // storing in a ref so we can start iterating on frames before they are all ready
  // they will appear as they are generated
  const refQrCodes = useRef<string[]>()
  const refImg = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!data) return
    let cancelled = false

    init().then(() => {
      if (data.length > Math.pow(2, 31)) {
        // eslint-disable-next-line no-console
        console.error("Data is too large to be encoded in a QR code")
        return
      }

      const framesCount = Math.ceil(data.length / FRAME_SIZE)
      const repairPackets = data.length <= FRAME_SIZE ? 0 : framesCount
      const framePrefix = numberToU8a(hexToNumber("0x80000000") + data.length)

      const encoder = Encoder.with_defaults(data, FRAME_SIZE)
      const frames = encoder
        .encode(repairPackets)
        .map((frame) => u8aToU8a(u8aConcat(framePrefix, u8aToU8a(frame))))

      ;(async () => {
        const qrCodeFrames: string[] = [] // work with a local var to prevent rerenders to mix they qrcodes (dev mode)
        refQrCodes.current = qrCodeFrames
        setTotalFramesCount(frames.length)

        for (const dataFrame of frames) {
          if (cancelled) return // stop computing for nothing, happens especially in dev because of strict mode double mount

          const blob = await new QRCodeStyling({
            type: "svg",
            data: decodeString(dataFrame),
            margin: 0,
            qrOptions: { mode: "Byte", errorCorrectionLevel: "L" },
            dotsOptions: { type: "square" },
            cornersSquareOptions: { type: "extra-rounded" },
            cornersDotOptions: { type: "dot" },
            image: talismanRedHandSvg,
            imageOptions: { hideBackgroundDots: true, imageSize: 0.7, margin: 5 },
          }).getRawData("svg")
          if (blob) qrCodeFrames.push(URL.createObjectURL(blob))
        }

        if (cancelled) return
      })()
    })

    return () => {
      cancelled = true
    }
  }, [data])

  useEffect(() => {
    const img = refImg.current
    if (!img || totalFramesCount === undefined) return

    let index = 0
    const interval = setInterval(() => {
      // array may change overtime, pick from ref
      const qrCodes = refQrCodes.current
      if (!qrCodes?.length) return

      index = (index + 1) % qrCodes.length
      img.src = qrCodes[index]
    }, 100)

    return () => clearInterval(interval)
  }, [totalFramesCount])

  return (
    <img
      ref={refImg}
      className={classNames("relative h-full w-full", totalFramesCount ? "block" : "hidden")}
    />
  )
}

// export as default module to make it possible to lazy import
export default RaptorQrCode