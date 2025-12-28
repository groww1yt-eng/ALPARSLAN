import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useRef } from "react"

interface Props {
  onClick: () => void
}

export default function StartDownloadButton({ onClick }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current
    if (!button) return

    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2

    const ripple = document.createElement("span")
    ripple.style.width = ripple.style.height = `${size}px`
    ripple.style.left = `${x}px`
    ripple.style.top = `${y}px`

    ripple.className =
      "absolute rounded-full bg-primary/30 animate-ripple pointer-events-none"

    button.appendChild(ripple)

    setTimeout(() => ripple.remove(), 600)
  }

  return (
    <Button
      ref={buttonRef}
      onClick={(e) => {
        createRipple(e)
        onClick()
      }}
      className="
        relative overflow-hidden w-full
        py-6
        rounded-xl
        font-medium text-lg
        gradient-primary text-white
        shadow-md
        transition-all duration-200 ease-out
        active:scale-[0.98]
      "
    >
      <Download className="h-5 w-5" />
      Start Download
    </Button>
  )
}
