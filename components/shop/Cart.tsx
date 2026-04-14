'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Package,
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CartItem {
  product_id: string
  variant_id?: string
  title_ru: string
  price: number // копейки
  quantity: number
  thumbnail_url?: string | null
  type: string
}

interface CartContextValue {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (product_id: string, variant_id?: string) => void
  updateQuantity: (product_id: string, quantity: number, variant_id?: string) => void
  clearCart: () => void
  totalCount: number
  totalAmount: number // копейки
}

// ─── Context ─────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'edu_cart'

function loadFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

function saveToStorage(items: CartItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore storage errors
  }
}

function isSame(a: CartItem, product_id: string, variant_id?: string): boolean {
  return a.product_id === product_id && a.variant_id === variant_id
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setItems(loadFromStorage())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveToStorage(items)
  }, [items, hydrated])

  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'>) => {
    setItems((prev) => {
      const existing = prev.find((i) => isSame(i, newItem.product_id, newItem.variant_id))
      if (existing) {
        return prev.map((i) =>
          isSame(i, newItem.product_id, newItem.variant_id)
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { ...newItem, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((product_id: string, variant_id?: string) => {
    setItems((prev) => prev.filter((i) => !isSame(i, product_id, variant_id)))
  }, [])

  const updateQuantity = useCallback(
    (product_id: string, quantity: number, variant_id?: string) => {
      if (quantity <= 0) {
        setItems((prev) => prev.filter((i) => !isSame(i, product_id, variant_id)))
      } else {
        setItems((prev) =>
          prev.map((i) =>
            isSame(i, product_id, variant_id) ? { ...i, quantity } : i
          )
        )
      }
    },
    []
  )

  const clearCart = useCallback(() => setItems([]), [])

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalCount, totalAmount }}
    >
      {children}
    </CartContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}

// ─── CartButton ───────────────────────────────────────────────────────────────

export function CartButton() {
  const { totalCount, items, removeItem, updateQuantity, totalAmount } = useCart()
  const [open, setOpen] = useState(false)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {/* Floating trigger */}
      <Dialog.Trigger asChild>
        <button
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
          aria-label="Открыть корзину"
        >
          <ShoppingCart className="w-6 h-6" />
          {totalCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
              {totalCount > 99 ? '99+' : totalCount}
            </span>
          )}
        </button>
      </Dialog.Trigger>

      {/* Overlay */}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Sheet/Drawer from the right */}
        <Dialog.Content className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background border-l shadow-xl flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <Dialog.Title className="text-lg font-semibold">
              Корзина
              {totalCount > 0 && (
                <span className="ml-2 text-sm text-muted-foreground font-normal">
                  {totalCount} {totalCount === 1 ? 'товар' : totalCount < 5 ? 'товара' : 'товаров'}
                </span>
              )}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="rounded-md p-1 hover:bg-accent transition-colors"
                aria-label="Закрыть"
              >
                <span className="sr-only">Закрыть</span>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path
                    d="M1.5 1.5l12 12m0-12l-12 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                <Package className="w-16 h-16 opacity-30" />
                <p className="text-lg font-medium">Корзина пуста</p>
                <p className="text-sm text-center">
                  Добавьте товары из{' '}
                  <Dialog.Close asChild>
                    <Link href="/shop" className="text-primary hover:underline">
                      магазина
                    </Link>
                  </Dialog.Close>{' '}
                  или{' '}
                  <Dialog.Close asChild>
                    <Link href="/catalog" className="text-primary hover:underline">
                      каталога курсов
                    </Link>
                  </Dialog.Close>
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {items.map((item) => (
                  <li
                    key={`${item.product_id}-${item.variant_id ?? ''}`}
                    className="flex gap-3 p-3 rounded-xl border bg-muted/20"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                      {item.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.thumbnail_url}
                          alt={item.title_ru}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">{item.title_ru}</p>
                      <p className="text-sm font-bold mt-1">
                        {(item.price / 100).toLocaleString('ru-RU')} ₽
                      </p>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.product_id, item.quantity - 1, item.variant_id)
                          }
                          className="w-7 h-7 flex items-center justify-center rounded-md border hover:bg-accent transition-colors"
                          aria-label="Уменьшить количество"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product_id, item.quantity + 1, item.variant_id)
                          }
                          className="w-7 h-7 flex items-center justify-center rounded-md border hover:bg-accent transition-colors"
                          aria-label="Увеличить количество"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item.product_id, item.variant_id)}
                      className="shrink-0 p-1 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Удалить товар"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="px-6 py-4 border-t space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Итого товаров:</span>
                <span className="font-bold text-base">
                  {(totalAmount / 100).toLocaleString('ru-RU')} ₽
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Стоимость доставки рассчитывается при оформлении
              </p>
              <Dialog.Close asChild>
                <Link
                  href="/checkout"
                  className="block w-full py-3 bg-primary text-primary-foreground rounded-lg text-center font-semibold hover:bg-primary/90 transition-colors"
                >
                  Оформить заказ
                </Link>
              </Dialog.Close>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
