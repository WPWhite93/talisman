import { Modal } from "@talisman/components/Modal"
import { ModalDialog } from "@talisman/components/ModalDialog"
import { AnalyticsPage, sendAnalyticsEvent } from "@ui/api/analytics"
import { useAddressBook } from "@ui/hooks/useAddressBook"
import { useAnalyticsPageView } from "@ui/hooks/useAnalyticsPageView"
import { Button } from "talisman-ui"

import { ContactModalProps } from "./types"

const ANALYTICS_PAGE: AnalyticsPage = {
  container: "Fullscreen",
  feature: "Settings",
  featureVersion: 1,
  page: "Address book contact delete",
}

export const ContactDeleteModal = ({ contact, isOpen, close }: ContactModalProps) => {
  const { deleteContact } = useAddressBook()
  useAnalyticsPageView(ANALYTICS_PAGE)

  return (
    <Modal open={isOpen} className="bg-black-secondary">
      <ModalDialog title="Delete contact">
        <div className="text-body-secondary my-12">
          You are deleting contact '<span className="font-bold text-white">{contact.name}</span>'
          from your address book.
        </div>
        <div className="flex items-stretch gap-4 pt-4">
          <Button fullWidth onClick={close}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              close()
              deleteContact(contact)
              sendAnalyticsEvent({
                ...ANALYTICS_PAGE,
                name: "Interact",
                action: "Delete address book contact",
              })
            }}
            fullWidth
            primary
          >
            Confirm
          </Button>
        </div>
      </ModalDialog>
    </Modal>
  )
}