import { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { useMagnetic } from '../hooks/useMagnetic'

type Props = HTMLMotionProps<'button'> & {
  radius?: number
  strength?: number
}

const MagneticButton = forwardRef<HTMLButtonElement, Props>(function MagneticButton(
  { radius, strength, children, style, ...rest },
  _ref,
) {
  const { ref, x, y } = useMagnetic({ radius, strength })
  return (
    <motion.button
      ref={ref as React.Ref<HTMLButtonElement>}
      style={{ x, y, ...style }}
      data-cursor="hover"
      {...rest}
    >
      {children}
    </motion.button>
  )
})

export default MagneticButton
