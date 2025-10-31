"use client";

import { useState } from "react";
import { NewVerifyForm } from "./new-verify-form";
import { UsernameForm } from "./username-form";

type TProps = {
  organization?: string;
  loginSettings: any;
  requestId?: string;
};

export const NewLoginForm = ({ organization, loginSettings, requestId }: TProps) => {
  const [step, setStep] = useState(1);
  return (
    <>
      {step === 1 && (
        <UsernameForm
          setStep={setStep}
          requestId={requestId}
          organization={organization}
          allowRegister={!!loginSettings?.allowRegister}
        />
      )}
      {step === 2 && <NewVerifyForm setStep={setStep} organization={organization} requestId={requestId} />}
    </>
  );
};
