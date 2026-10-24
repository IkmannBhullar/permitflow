import Link from "next/link"

import { Disclaimer } from "@/components/disclaimer"
import { Logo } from "@/components/logo"

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-muted/40 px-4 py-12">
      <Link href="/" aria-label="PermitFlow home">
        <Logo />
      </Link>
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-xs sm:p-8">
        {children}
      </div>
      <Disclaimer className="max-w-sm text-center" />
    </div>
  )
}
