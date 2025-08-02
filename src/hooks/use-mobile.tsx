import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // 檢查 matchMedia 是否可用
    if (window.matchMedia && typeof window.matchMedia === 'function') {
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
      mql.addEventListener("change", onChange)
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      return () => mql.removeEventListener("change", onChange)
    } else {
      // 備用方案：只根據當前視窗寬度設定狀態
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      return () => {}
    }
  }, [])

  return !!isMobile
}
