"use client";

import { LoginSettings } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "./alert";
import { Translated } from "./translated";
import { useTranslations } from "next-intl";
import { PhoneInput } from "./phone-input";
import { ButtonsAuth } from "./buttons-auth";
import { startPhoneLogin } from "@/lib/server/login-phone";

export type Inputs = {
  phone: string;
};

type Props = {
  setStep: Dispatch<SetStateAction<number>>;
  setUserId: Dispatch<SetStateAction<string | null>>;
  requestId: string | undefined;
  organization?: string;
  allowRegister: boolean;
};

export function PhoneForm({ setStep, requestId, organization, allowRegister, setUserId }: Props) {
  const { register, handleSubmit, formState } = useForm<Inputs>({
    mode: "onBlur",
    defaultValues: {
      phone: "",
    },
  });
  const { errors } = formState;

  const t = useTranslations("loginname");

  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  async function submitLoginName(values: Inputs) {
    setLoading(true);
    try {
      const result = await startPhoneLogin(values.phone);
      setUserId(result.userId);
      setStep(2);
    } catch (error) {
      // Показать ошибку пользователю
    } finally {
      setLoading(false);
    }
    // const res = await sendLoginname({
    //   loginName: values.loginName,
    //   organization,
    //   requestId,
    //   suffix,
    // })
    //   .catch(() => {
    //     setError(t("errors.internalError"));
    //     return;
    //   })
    //   .finally(() => {
    //     setLoading(false);
    //   });

    // if (res && "redirect" in res && res.redirect) {
    //   return router.push(res.redirect);
    // }

    // if (res && "error" in res && res.error) {
    //   setError(res.error);
    //   return;
    // }
  }

  return (
    <form className="w-full">
      <div className="">
        <div className="col-span-2">
          <PhoneInput register={register} errors={errors} />
        </div>
        {allowRegister && (
          <button
            className="text-sm transition-all hover:text-primary-light-500 dark:hover:text-primary-dark-500"
            onClick={() => {
              const registerParams = new URLSearchParams();
              if (organization) {
                registerParams.append("organization", organization);
              }
              if (requestId) {
                registerParams.append("requestId", requestId);
              }

              router.push("/register?" + registerParams);
            }}
            type="button"
            disabled={loading}
            data-testid="register-button"
          >
            <Translated i18nKey="register" namespace="loginname" />
          </button>
        )}
      </div>

      {error && (
        <div className="py-4" data-testid="error">
          <Alert>{error}</Alert>
        </div>
      )}
      <ButtonsAuth loading={loading} formState={formState} handleSubmit={handleSubmit(submitLoginName)} />
    </form>
  );
}
