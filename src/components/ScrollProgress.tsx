'use client'

import { motion, useScroll, useSpring } from 'framer-motion'

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })

  return (
    <div className="sticky top-[48px] z-30"> 
      {/* adapte "48px" à la hauteur réelle de ton header */}
      <div className="h-[3px] bg-accent/25" />
      <motion.div
        className="absolute top-0 left-0 right-0 h-[3px] bg-accent origin-left shadow-[0_1px_0_rgba(0,0,0,0.06)]"
        style={{ scaleX }}
      />
    </div>
  )
}