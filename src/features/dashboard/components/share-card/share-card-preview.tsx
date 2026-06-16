import { type RefObject } from "react"
import { ShareCard, type ShareCardProps } from "@/features/dashboard/components/share-card/share-card"
import { SHARE_CARD_DIMENSIONS } from "@/features/dashboard/components/share-card/share-card.constants"

type ShareCardPreviewProps = ShareCardProps & {
  /** Available pixel width inside the dialog content area (e.g. 480) */
  maxWidth: number
  /** Ref forwarded to the UNSCALED ShareCard — this is what html-to-image captures */
  cardRef: RefObject<HTMLDivElement | null>
}

/**
 * CSS-scaled preview wrapper.
 * ADR-3: One ShareCard instance at full pixel size; CSS scale shrinks it visually.
 * html-to-image captures via cardRef which points to the unscaled node — WYSIWYG.
 */
export function ShareCardPreview({
  maxWidth,
  cardRef,
  ...shareCardProps
}: ShareCardPreviewProps) {
  const { width, height } = SHARE_CARD_DIMENSIONS[shareCardProps.dimensions]
  const scale = Math.min(1, maxWidth / width)

  return (
    <div
      style={{
        width: width * scale,
        height: height * scale,
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width,
          height,
          transformOrigin: "top left",
          transform: `scale(${scale})`,
        }}
      >
        <ShareCard ref={cardRef} {...shareCardProps} />
      </div>
    </div>
  )
}
