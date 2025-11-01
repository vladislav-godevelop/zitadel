"use client";

import { RegisterForm } from "./register-form";
import { useCallback, useState } from "react";
import { InputsCode, NewVerifyForm } from "./new-verify-form";
import { RegisterPhoneForm } from "./register-phone-form";
import { verifyPhoneCode } from "@/lib/registerPhone";
import { useRouter } from "next/navigation";

type TProps = {
  organization?: string;
  legal: any;
  loginSettings: any;
  identityProviders: any;
  requestId?: string;
};

export const NewRegisterForm = ({ legal, organization, loginSettings, identityProviders, requestId }: TProps) => {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const registerParams = new URLSearchParams();

  const [userId, setUserId] = useState<string | null>(null);
  const fcn = useCallback(
    async function submitCodeAndContinue(value: InputsCode): Promise<boolean | void> {
      try {
        if (!userId) return;
        const success = await verifyPhoneCode(userId, value.code);

        if (success) {
          router.push("/login-phone?" + registerParams);
          return true;
        }

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
      {step === 1 && legal && organization && (
        <RegisterPhoneForm
          setStep={setStep}
          setUserId={setUserId}
          idpCount={!loginSettings?.allowExternalIdp ? 0 : identityProviders.length}
          legal={legal}
          organization={organization}
          requestId={requestId}
          loginSettings={loginSettings}
        />
      )}
      {step === 2 && <NewVerifyForm fcn={fcn} setStep={setStep} organization={organization} requestId={requestId} />}
    </>
  );
};
