"use client";
import { FormState } from "react-hook-form";
import { BackButton } from "./back-button";
import { Button, ButtonVariants } from "./button";
import { Spinner } from "./spinner";
import { Translated } from "./translated";
import { MouseEventHandler } from "react";

type TProps<T extends object> = {
  loading: boolean;
  formState: FormState<T>;
  handleSubmit: MouseEventHandler<HTMLButtonElement>;
  onBack?: () => void;
  isDisabled?: boolean;
};

export const ButtonsAuth = <T extends object>({ loading, formState, handleSubmit, onBack, isDisabled }: TProps<T>) => {
  return (
    <div className="mt-8 flex w-full flex-row items-center justify-between gap-4">
      <BackButton onClick={onBack && onBack} className="w-full justify-center flex" />
      <span className="flex-grow"></span>
      <Button
        className="w-full justify-center"
        type="submit"
        variant={ButtonVariants.Primary}
        disabled={loading || !formState.isValid || isDisabled}
        onClick={handleSubmit}
        data-testid="submit-button"
      >
        {loading && <Spinner className="mr-2 h-5 w-5" />}
        <Translated i18nKey="verify.submit" namespace="verify" />
      </Button>
    </div>
  );
};
