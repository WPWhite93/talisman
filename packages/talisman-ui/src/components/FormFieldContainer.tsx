import { FC, ReactNode } from "react"
import { classNames } from "../utils"

type FormFieldContainerProps = {
  className?: string
  label: string
  children: ReactNode
  error?: string | null
}

export const FormFieldContainer: FC<FormFieldContainerProps> = ({
  className,
  label,
  children,
  error,
}) => {
  return (
    <div className={classNames("leading-base text-left text-base", className)}>
      <div className="text-body-secondary">{label}</div>
      <div className="mt-4">{children}</div>
      <div className="text-alert-warn h-8 max-w-full overflow-hidden text-ellipsis whitespace-nowrap py-2 text-right text-xs uppercase leading-none">
        {error}
      </div>
    </div>
  )
}