"use client";

import { Alert, AlertType } from "@/components/alert";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { TextInput } from "./input";
import { Translated } from "./translated";
import { ButtonsAuth } from "./buttons-auth";

type Inputs = {
  code: string;
};

type Props = {
  organization?: string;
  requestId?: string;
  setStep: Dispatch<SetStateAction<number>>;
};

export function NewVerifyForm({ setStep, organization, requestId }: Props) {
  const router = useRouter();

  const { register, handleSubmit, formState } = useForm<Inputs>({
    mode: "onBlur",
    defaultValues: {
      code: "",
    },
  });

  const t = useTranslations("verify");

  const [error, setError] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);

  async function resendCode() {
    // setError("");
    // setLoading(true);
    // const response = await resendVerification({
    //   userId,
    //   isInvite: isInvite,
    // })
    //   .catch(() => {
    //     setError(t("errors.couldNotResendEmail"));
    //     return;
    //   })
    //   .finally(() => {
    //     setLoading(false);
    //   });
    // if (response && "error" in response && response?.error) {
    //   setError(response.error);
    //   return;
    // }
    // return response;
  }

  const fcn = useCallback(async function submitCodeAndContinue(value: Inputs): Promise<boolean | void> {
    // setLoading(true);
    // const response = await sendVerification({
    //   code: value.code,
    //   userId,
    //   isInvite: isInvite,
    //   loginName: loginName,
    //   organization: organization,
    //   requestId: requestId,
    // })
    //   .catch(() => {
    //     setError(t("errors.couldNotVerifyUser"));
    //     return;
    //   })
    //   .finally(() => {
    //     setLoading(false);
    //   });
    // if (response && "error" in response && response?.error) {
    //   setError(response.error);
    //   return;
    // }
    // if (response && "redirect" in response && response?.redirect) {
    //   return router.push(response?.redirect);
    // }
  }, []);

  return (
    <>
      <form className="w-full">
        <Alert type={AlertType.INFO}>
          <div className="flex flex-row">
            <span className="mr-auto flex-1 text-left">
              <Translated i18nKey="verify.noCodeReceived" namespace="verify" />
            </span>
            <button
              aria-label="Resend Code"
              disabled={loading}
              type="button"
              className="ml-4 cursor-pointer text-primary-light-500 hover:text-primary-light-400 disabled:cursor-default disabled:text-gray-400 dark:text-primary-dark-500 hover:dark:text-primary-dark-400 dark:disabled:text-gray-700"
              onClick={() => {
                resendCode();
              }}
              data-testid="resend-button"
            >
              <Translated i18nKey="verify.resendCode" namespace="verify" />
            </button>
          </div>
        </Alert>
        <div className="mt-4">
          <TextInput
            type="text"
            autoComplete="one-time-code"
            {...register("code", { required: t("verify.required.code") })}
            label={t("verify.labels.code")}
            data-testid="code-text-input"
          />
        </div>

        {error && (
          <div className="py-4" data-testid="error">
            <Alert>{error}</Alert>
          </div>
        )}

        <ButtonsAuth onBack={() => setStep(1)} loading={loading} formState={formState} handleSubmit={handleSubmit(fcn)} />
      </form>
    </>
  );
}
