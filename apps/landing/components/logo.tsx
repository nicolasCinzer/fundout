import Image from "next/image";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <Image
        src="/brand/fundout-symbol.svg"
        alt=""
        width={28}
        height={28}
        className="size-7"
        priority
        aria-hidden
      />
      <div className="flex flex-col leading-none">
        <span className="font-heading text-[15px] font-bold tracking-tight text-foreground">
          Fundout
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">
          It&apos;s just math.
        </span>
      </div>
    </div>
  );
}
