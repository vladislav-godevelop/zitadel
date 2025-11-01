"use client";

import { useCallback, useState } from "react";
import { InputsCode, NewVerifyForm } from "./new-verify-form";
import { UsernameForm } from "./username-form";
import { PhoneForm } from "./phone-form";
import { verifyPhoneLogin } from "@/lib/server/login-phone";
import { useRouter } from "next/navigation";

type TProps = {
  organization?: string;
  loginSettings: any;
  requestId?: string;
};

export const NewLoginForm = ({ organization, loginSettings, requestId }: TProps) => {
  const [step, setStep] = useState(1);

  const [userId, setUserId] = useState<string | null>(null);

  const fcn = useCallback(
    async function submitCodeAndContinue(value: InputsCode): Promise<boolean | void> {
      try {
        if (!userId) return;
        await verifyPhoneLogin(userId, value.code, requestId);

        return false;
      } catch (error) {
        console.error("Registration process failed:", error);
        throw error;
      }
    },
    [userId],
  );
  return (
    <>
      {step === 1 && (
        <PhoneForm
          setUserId={setUserId}
          setStep={setStep}
          requestId={requestId}
          organization={organization}
          allowRegister={!!loginSettings?.allowRegister}
        />
      )}
      {step === 2 && <NewVerifyForm fcn={fcn} setStep={setStep} organization={organization} requestId={requestId} />}
    </>
  );
};
