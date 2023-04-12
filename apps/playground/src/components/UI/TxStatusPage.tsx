import { useState } from "react"
import { Button, ProcessAnimation, ProcessAnimationStatus } from "talisman-ui"

import { TestLayout } from "../shared/TestLayout"

export const TxStatusPage = () => {
  const [status, setStatus] = useState<ProcessAnimationStatus>("processing")

  return (
    <TestLayout title="Mystical Background">
      <div className="my-16 flex gap-8">
        <Button primary={status === "processing"} onClick={() => setStatus("processing")}>
          Processing
        </Button>
        <Button primary={status === "success"} onClick={() => setStatus("success")}>
          Success
        </Button>
        <Button primary={status === "failure"} onClick={() => setStatus("failure")}>
          Failure
        </Button>
      </div>
      <div>
        <ProcessAnimation status={status} className="h-96 " />
      </div>
    </TestLayout>
  )
}