import React from "react"

const motionProxy = new Proxy(
  {},
  {
    get: (_target, key) => {
      return React.forwardRef(({ children, ...props }: any, ref) => {
        const Tag = key as string
        return <Tag {...props} ref={ref}>{children}</Tag>
      })
    },
  }
)

export const motion = motionProxy
export const AnimatePresence = ({ children }: any) => children
export const useAnimation = () => ({ start: () => Promise.resolve() })
export const useMotionValue = (initial: any) => ({ get: () => initial, set: () => {} })
export const useTransform = (value: any) => value
