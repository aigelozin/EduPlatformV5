import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MobileNav } from '@/components/layout/MobileNav'
import { CookieBanner } from '@/components/layout/CookieBanner'
import { CartProvider, CartButton } from '@/components/shop/Cart'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <Footer />
        <CookieBanner />
        <CartButton />
        <MobileNav />
      </div>
    </CartProvider>
  )
}
