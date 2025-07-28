import { useEffect, useState } from "react"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

// 簡單自製的主題 hook
const useTheme = () => {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system")
  
  useEffect(() => {
    // 從 localStorage 讀取主題設置
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" || "system"
    setTheme(savedTheme)
    
    // 監聽主題變化
    const handleThemeChange = () => {
      const newTheme = localStorage.getItem("theme") as "light" | "dark" | "system" || "system"
      setTheme(newTheme)
    }
    
    window.addEventListener("storage", handleThemeChange)
    return () => window.removeEventListener("storage", handleThemeChange)
  }, [])
  
  return theme
}

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export { Toaster, toast }
