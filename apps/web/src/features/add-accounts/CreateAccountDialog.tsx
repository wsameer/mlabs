import { useOpenCreateAccount, useUiActions } from "@/hooks/use-ui-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@workspace/ui/components/dialog";
import { useState } from "react";
import type { AccountGroupType } from "@workspace/types";
import { AccountGroupStep } from "./AccountGroupStep";
import { AccountFormStep } from "./AccountFormStep";

type Step = "select" | "form";

export function CreateAccountDialog() {
  const isOpen = useOpenCreateAccount();
  const { setOpenCreateAccount } = useUiActions();

  const [step, setStep] = useState<Step>("select");
  const [selectedType, setSelectedType] = useState<AccountGroupType | null>(
    null
  );

  function handleTypeSelect(type: AccountGroupType) {
    setSelectedType(type);
    setStep("form");
  }

  function handleClose() {
    setOpenCreateAccount(false);
    setTimeout(() => {
      setStep("select");
      setSelectedType(null);
    }, 300);
  }

  function handleBack() {
    setSelectedType(null);
    setStep("select");
  }

  const title = step === "select" ? "Create Account" : "Enter account details";
  const description =
    step === "select"
      ? "What type of account would you like to add?"
      : "Fill in the details for your new account and submit";

  const content =
    step === "select" ? (
      <AccountGroupStep onSelect={handleTypeSelect} />
    ) : (
      <AccountFormStep
        type={selectedType!}
        onSuccess={handleClose}
        onBack={handleBack}
      />
    );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="p-0 sm:max-w-[425px]">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
