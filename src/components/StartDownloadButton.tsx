import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useRef } from "react"

interface Props {
  onClick: () => void
  disabled?: boolean
}

export default function StartDownloadButton({ onClick, disabled }: Props) {
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
      disabled={disabled}
      onClick={(e) => {
        if (disabled) return
        createRipple(e)
        onClick()
      }}
      className={`
        relative overflow-hidden w-full
        py-6
        rounded-xl
        font-medium text-lg
        gradient-primary text-white
        shadow-md
        transition-all duration-200 ease-out
        active:scale-[0.98]
        ${disabled ? 'opacity-50 cursor-not-allowed active:scale-100 hover:shadow-md' : ''}
      `}
    >
      <Download className="h-5 w-5" />
      {disabled ? 'Wait for current download...' : 'Start Download'}
    </Button>
  )
}
