"use client";

import { LegalAndSupportSettings } from "@zitadel/proto/zitadel/settings/v2/legal_settings_pb";
import { LoginSettings, PasskeysType } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Alert, AlertType } from "./alert";
import { AuthenticationMethod, methods } from "./authentication-method-radio";
import { PrivacyPolicyCheckboxes } from "./privacy-policy-checkboxes";
import { Translated } from "./translated";
import { ButtonsAuth } from "./buttons-auth";
import { PhoneInput } from "./phone-input";
import { Inputs } from "./phone-form";
import { registerPhone } from "@/lib/server/register-phone";

type Props = {
  legal: LegalAndSupportSettings;
  requestId?: string;
  organization?: string;
  setStep: Dispatch<SetStateAction<number>>;
  setUserId: Dispatch<SetStateAction<string | null>>;
  loginSettings?: LoginSettings;
  idpCount: number;
};

export function RegisterPhoneForm({
  legal,
  setStep,
  requestId,
  organization,
  loginSettings,
  idpCount = 0,
  setUserId,
}: Props) {
  const { register, handleSubmit, formState } = useForm<Inputs>({
    mode: "onBlur",

    defaultValues: {
      phone: "",
    },
  });

  const t = useTranslations("register");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const { errors } = formState;

  const [tosAndPolicyAccepted, setTosAndPolicyAccepted] = useState(false);

  // Check if legal acceptance is required
  const isLegalAcceptanceRequired = !!(legal?.tosLink || legal?.privacyPolicyLink);
  const canSubmit = formState.isValid && (!isLegalAcceptanceRequired || tosAndPolicyAccepted);
  const fcn = async (values: any) => {
    setLoading(true);
    try {
      const user = await registerPhone(values.phone, organization!);
      setUserId(user);
      setStep(2);
    } catch (error) {
      console.error("Registration failed:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <form className="w-full">
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <PhoneInput register={register} errors={errors} />
        </div>
      </div>
      {(legal?.tosLink || legal?.privacyPolicyLink) && (
        <PrivacyPolicyCheckboxes legal={legal} onChange={setTosAndPolicyAccepted} />
      )}

      {!loginSettings?.allowUsernamePassword &&
        loginSettings?.passkeysType !== PasskeysType.ALLOWED &&
        (!loginSettings?.allowExternalIdp || !idpCount) && (
          <div className="py-4">
            <Alert type={AlertType.INFO}>
              <Translated i18nKey="noMethodAvailableWarning" namespace="register" />
            </Alert>
          </div>
        )}

      {error && (
        <div className="py-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <ButtonsAuth
        isDisabled={!tosAndPolicyAccepted}
        loading={loading}
        formState={formState}
        handleSubmit={handleSubmit(fcn)}
      />
    </form>
  );
}
