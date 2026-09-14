"use client"

import * as React from "react"

const QUERY = "(max-width: 767px)"

/** true below md breakpoint; false during SSR */
export function useIsMobile() {
  const [mobile, setMobile] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const update = () => setMobile(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])
  return mobile
}
