'use client'
import { useEffect } from 'react'

interface Props {
  productId: string
}

export function ViewTracker({ productId }: Props) {
  useEffect(() => {
    fetch(`/api/products/${productId}/view`, { method: 'POST' }).catch(() => {
      // fire-and-forget — ignore errors
    })
  }, [productId])

  return null
}
