import { api } from "@ui/api"
import posthog from "posthog-js"
import { useCallback } from "react"

export const useAnalytics = () => {
  const genericEvent = useCallback((eventName: string, options: posthog.Properties = {}) => {
    api.analyticsCapture({ eventName, options })
  }, [])

  const pageOpenEvent = useCallback((pageName: string) => {
    api.analyticsCapture({ eventName: `open ${pageName}` })
  }, [])

  const popupOpenEvent = useCallback((page: string) => {
    api.analyticsCapture({ eventName: "open popup", options: { page } })
  }, [])

  return {
    genericEvent,
    pageOpenEvent,
    popupOpenEvent,
  }
}