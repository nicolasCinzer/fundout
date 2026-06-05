import { cn } from "@/lib/utils"

type BrandMarkProps = {
  size?: "sm" | "md" | "lg"
  tagline?: boolean
  className?: string
}

const sizeConfig = {
  sm: {
    symbol: "size-10 group-data-[collapsible=icon]:size-8",
    wordmark: "text-sm font-semibold",
  },
  md: {
    symbol: "size-10",
    wordmark: "text-base font-semibold",
  },
  lg: {
    symbol: "size-14",
    wordmark: "text-xl font-semibold",
  },
}

function FundoutSymbol({ className }: { className?: string }) {
  return (
    <div className={cn("shrink-0", className)}>
      <svg
        viewBox="105 148 300 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-full!"
        aria-hidden="true"
      >
        <path
          d="M249.226 152.018L263.15 152C262.649 179.379 261.889 196.213 273.653 222.389C289.692 258.083 318.921 283.286 355.175 297.153C355.388 284.156 355.388 271.157 355.174 258.16L366.776 258.184C366.573 272.198 366.717 286.633 366.706 300.675C381.227 303.973 386.463 305.495 401.482 306.283C401.721 310.733 401.834 315.32 402 319.784C388.734 318.975 379.597 318.151 366.634 314.958L366.654 359.231L354.977 359.285L355.155 312.001C310.804 294.913 275.79 266.835 257.987 221.58C257.274 219.659 256.35 217.54 255.567 215.624C254.588 218.154 253.55 220.661 252.454 223.144C232.66 268.507 201.231 294.304 156.013 311.983L156.078 359.35L144.75 359.365C144.562 344.793 144.826 329.595 144.876 314.973C132.621 317.704 121.483 318.502 109.059 319.286L109 306.456C118.618 306.032 136.148 303.753 144.801 300.211L144.635 258.169L156.063 258.2L156.25 297.073C176.439 289.522 194.752 277.681 209.924 262.37C230.691 241.323 244.61 214.091 248.571 184.541C249.717 175.987 249.273 161.218 249.226 152.018Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          d="M355.037 202.112L366.673 202.113L366.875 242.107L355.017 242.113L355.037 202.112Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          d="M144.33 202.149L155.567 202.112L155.625 242.015L144.289 242.005L144.33 202.149Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="4"
        />
      </svg>
    </div>
  )
}

export function BrandMark({ size = "md", tagline = false, className }: BrandMarkProps) {
  const cfg = sizeConfig[size]

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <FundoutSymbol className={cn("text-primary", cfg.symbol)} />
      <div className="grid flex-1 leading-tight group-data-[collapsible=icon]:hidden">
        <span className={cn("font-heading", cfg.wordmark)}>Fundout</span>
        {tagline && (
          <span className="truncate text-xs text-muted-foreground">
            It's just math.
          </span>
        )}
      </div>
    </div>
  )
}
