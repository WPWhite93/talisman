import { notify } from "@talisman/components/Notifications"
import { useOpenClose } from "@talisman/hooks/useOpenClose"
import { Chain, CustomChain } from "@talismn/chaindata-provider"
import { api } from "@ui/api"
import { FC, useCallback } from "react"
import { Trans, useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ModalDialog } from "talisman-ui"
import { Button, Modal } from "talisman-ui"

export const ResetSubNetworkButton: FC<{ chain: Chain | CustomChain }> = ({ chain }) => {
  const { t } = useTranslation("admin")
  const navigate = useNavigate()
  const { isOpen, open, close } = useOpenClose()

  const handleConfirmReset = useCallback(async () => {
    if (!chain) return
    try {
      await api.chainReset(chain.id)
      navigate("/networks/polkadot")
    } catch (err) {
      notify({
        title: t("Failed to reset"),
        subtitle: (err as Error).message,
        type: "error",
      })
    }
  }, [chain, navigate, t])

  const name = chain?.name ?? t("N/A")

  return (
    <>
      <Button type="button" className="mt-8" onClick={open}>
        {t("Reset to defaults")}
      </Button>
      <Modal isOpen={isOpen && !!chain} onDismiss={close}>
        <ModalDialog title={t("Reset Network")} onClose={close}>
          <div className="text-body-secondary mt-4 space-y-16">
            <div className="text-base">
              <Trans t={t}>
                Network <span className="text-body">{name}</span> will be reset to Talisman's
                default settings.
              </Trans>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <Button onClick={close}>{t("Cancel")}</Button>
              <Button primary onClick={handleConfirmReset}>
                {t("Reset")}
              </Button>
            </div>
          </div>
        </ModalDialog>
      </Modal>
    </>
  )
}