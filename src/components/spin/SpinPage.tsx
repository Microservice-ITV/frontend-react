import { useEffect } from 'react'
import { ShoppingCart } from 'lucide-react'
import styles from './SpinPage.module.css'

const BAR_COUNT = 12

const barColor = (index: number) => {
  const fade = index / (BAR_COUNT - 1)
  const mix = (from: number, to: number) => Math.round(from + (to - from) * fade)
  const red = mix(0, 232)
  const green = mix(230, 255)
  const blue = mix(118, 246)
  return `rgb(${red}, ${green}, ${blue})`
}

const SpinPage = () => {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  return (
    <div className={styles.page} role="status" aria-live="polite" aria-busy="true">
      <div className={styles.mark}>
        <div className={styles.ring} aria-hidden="true">
          {Array.from({ length: BAR_COUNT }, (_, index) => (
            <span
              key={index}
              className={styles.bar}
              style={{
                background: barColor(index),
                transform: `rotate(${index * (360 / BAR_COUNT)}deg)`,
              }}
            />
          ))}
        </div>
        <div className={styles.cart}>
          <ShoppingCart size={38} strokeWidth={2.25} aria-hidden="true" />
        </div>
      </div>
      <p className={styles.label}>Daily need items</p>
      <span className={styles.srOnly}>Loading</span>
    </div>
  )
}

export default SpinPage
