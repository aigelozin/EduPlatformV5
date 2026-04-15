'use client'

import { useCart } from './Cart'

interface AddToCartButtonProps {
  productId: string
  type: string
  titleRu: string
  price: number
  thumbnailUrl?: string | null
}

export function AddToCartButton({
  productId,
  type,
  titleRu,
  price,
  thumbnailUrl,
}: AddToCartButtonProps) {
  const { addItem } = useCart()

  function handleClick() {
    addItem({
      product_id: productId,
      type,
      title_ru: titleRu,
      price,
      thumbnail_url: thumbnailUrl,
    })
  }

  return (
    <button
      onClick={handleClick}
      className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
    >
      В корзину
    </button>
  )
}
