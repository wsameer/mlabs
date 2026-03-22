import { useOpenCreateAccount, useUiActions } from "@/hooks/use-ui-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@workspace/ui/components/dialog";
import { useState } from "react";
import type { AccountType } from "./types";
import { AccountTypeStep } from "./AccountTypeStep";
import { AccountFormStep } from "./AccountFormStep";

type Step = "select" | "form";

export function CreateAccountDialog() {
  const isOpen = useOpenCreateAccount();
  const { setOpenCreateAccount } = useUiActions();

  const [step, setStep] = useState<Step>("select");
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);

  function handleTypeSelect(type: AccountType) {
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
      <AccountTypeStep onSelect={handleTypeSelect} />
    ) : (
      <AccountFormStep
        type={selectedType!}
        onSuccess={handleClose}
        onBack={handleBack}
      />
    );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px] p-0">
        <DialogHeader className="pt-4 px-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
