"use client";

import { MAX_QTY } from "@/lib/cart";

type QuantityStepperProps = {
  value: number;
  onChange: (value: number) => void;
  /** lg: stranica proizvoda · sm: stavka u korpi */
  size?: "lg" | "sm";
  /** Najveća količina; manja je od opšteg ograničenja kada je na stanju manje komada. */
  max?: number;
};

const sizes = {
  lg: { button: "h-[56px] w-[48px] text-[20px] text-ink", value: "min-w-[36px] text-[17px]" },
  sm: { button: "h-[44px] w-[44px] text-[18px]", value: "min-w-[28px]" },
};

export function QuantityStepper({
  value,
  onChange,
  size = "lg",
  max = MAX_QTY,
}: QuantityStepperProps) {
  const styles = sizes[size];

  return (
    <div className="flex items-center border border-line-strong">
      <button
        type="button"
        aria-label="Smanji količinu"
        onClick={() => onChange(Math.max(value - 1, 1))}
        className={`cursor-pointer ${styles.button}`}
      >
        −
      </button>
      <div className={`text-center ${styles.value}`} aria-live="polite">
        {value}
      </div>
      <button
        type="button"
        aria-label="Povećaj količinu"
        onClick={() => onChange(Math.min(value + 1, max))}
        disabled={value >= max}
        className={`cursor-pointer disabled:cursor-default disabled:text-line-strong ${styles.button}`}
      >
        +
      </button>
    </div>
  );
}
