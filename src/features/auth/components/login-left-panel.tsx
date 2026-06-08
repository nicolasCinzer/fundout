import { BarChart2, Calculator, Shuffle } from "lucide-react"
import { BrandMark } from "@/components/common/brand-mark"

type ValueBulletProps = {
  icon: React.ElementType
  children: React.ReactNode
}

function ValueBullet({ icon: Icon, children }: ValueBulletProps) {
  return (
    <li className="flex items-center gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <span className="text-sm text-foreground/90">{children}</span>
    </li>
  )
}

export function LoginLeftPanel() {
  return (
    <div className="hidden md:flex md:flex-col md:justify-between p-10 lg:p-12 bg-gradient-to-br from-primary/10 via-background to-background dark:from-primary/15 dark:via-background dark:to-background relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:radial-gradient(var(--foreground)_1px,transparent_1px)] [background-size:18px_18px]"
      />

      <BrandMark size="lg" tagline />

      <div>
        <h1 className="font-heading text-3xl lg:text-4xl tracking-tight">
          Track your propfirm journey.
        </h1>
        <p className="mt-3 text-muted-foreground text-base lg:text-lg">
          Plan. Withdraw. Scale.
        </p>
      </div>

      <ul className="space-y-4">
        <ValueBullet icon={BarChart2}>
          Every evaluation, funded account, and payout in one place.
        </ValueBullet>
        <ValueBullet icon={Calculator}>
          Win probability and ROI before you buy a challenge.
        </ValueBullet>
        <ValueBullet icon={Shuffle}>
          Monte Carlo simulations to stress-test your bankroll.
        </ValueBullet>
      </ul>
    </div>
  )
}
