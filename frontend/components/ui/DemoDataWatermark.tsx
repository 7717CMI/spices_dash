'use client'

interface DemoDataWatermarkProps {
  className?: string
}

export function DemoDataWatermark({ className = '' }: DemoDataWatermarkProps) {
  return (
    <div 
      className={`absolute inset-0 pointer-events-none flex items-center justify-center ${className}`}
      style={{
        zIndex: 9999,
        opacity: 0.4,
        userSelect: 'none'
      }}
    >
      <div 
        className="text-7xl font-bold text-yellow-300 transform -rotate-45"
        style={{
          fontFamily: 'Arial, sans-serif',
          letterSpacing: '0.1em',
          textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
          fontWeight: '800'
        }}
      >
        DEMO
      </div>
    </div>
  )
}

