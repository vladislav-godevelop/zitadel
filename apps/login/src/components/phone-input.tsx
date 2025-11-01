"use client";
import { useTranslations } from "next-intl";
import { TextInput } from "./input";
import { UseFormRegister } from "react-hook-form";
import { Inputs } from "./phone-form";

type TProps = {
  register: UseFormRegister<Inputs>;
  errors: any;
};

export const PhoneInput = ({ register, errors }: TProps) => {
  const t = useTranslations("register");

  return (
    <TextInput
      type="phone"
      placeholder="+7 999 999 99 99"
      autoComplete="phone"
      required
      {...register("phone", {
        required: t("required.phone"),
        validate: {
          format: (value) => /^\+?[\d\s\-\(\)]+$/.test(value) || t("invalid.phone.format"),
          length: (value) => value.replace(/\D/g, "").length >= 10 || t("invalid.phone.min"),
        },
      })}
      label={t("labels.phone")}
      error={errors.phone?.message as string}
      data-testid="phone-text-input"
    />
  );
};
