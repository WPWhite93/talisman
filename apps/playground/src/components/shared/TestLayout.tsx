import { ReactNode } from "react"

export const TestLayout = ({ title, children }: { title?: string; children?: ReactNode }) => {
  return (
    <div className="text-left">
      <h2 className="text-3xl">{title}</h2>
      {children}
    </div>
  )
}