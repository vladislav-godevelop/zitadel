"use client";

import { useRouter } from "next/navigation";
import { Button, ButtonVariants } from "./button";
import { Translated } from "./translated";

export function BackButton({ className, onClick }: { className?: string; onClick?: () => void }) {
  const router = useRouter();
  return (
    <Button
      className={className}
      onClick={() => (!!onClick ? onClick() : router.back())}
      type="button"
      variant={ButtonVariants.Secondary}
    >
      <Translated i18nKey="back" namespace="common" />
    </Button>
  );
}
