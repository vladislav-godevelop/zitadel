"use client";

import { RegisterForm } from "./register-form";
import { useState } from "react";
import { NewVerifyForm } from "./new-verify-form";

type TProps = {
  organization?: string;
  legal: any;
  loginSettings: any;
  identityProviders: any;
  requestId?: string;
};

export const NewRegisterForm = ({ legal, organization, loginSettings, identityProviders, requestId }: TProps) => {
  const [step, setStep] = useState(1);
  return (
    <>
      {step === 1 && legal && organization && (
        <RegisterForm
          setStep={setStep}
          idpCount={!loginSettings?.allowExternalIdp ? 0 : identityProviders.length}
          legal={legal}
          organization={organization}
          requestId={requestId}
          loginSettings={loginSettings}
        />
      )}
      {step === 2 && <NewVerifyForm setStep={setStep} organization={organization} requestId={requestId} />}
    </>
  );
};
