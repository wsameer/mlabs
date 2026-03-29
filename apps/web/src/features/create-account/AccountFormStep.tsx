import { useState } from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

import { Controller, useForm } from "react-hook-form";
import { ChevronDownIcon, DollarSignIcon } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Calendar } from "@workspace/ui/components/calendar";
import { ACCOUNT_TYPES, type AccountType } from "./types";

dayjs.extend(customParseFormat);

const accountFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  balance: z.coerce.number({ invalid_type_error: "Balance is required" }),
  type: z.enum(ACCOUNT_TYPES, { message: "Please select an account type" }),
  availableCredit: z.coerce.number().optional(),
  expirationDate: z.date().optional(),
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;

interface Props {
  type: AccountType;
  onSuccess: (data: AccountFormValues) => void;
  onBack: () => void;
}

export function AccountFormStep({ type, onSuccess, onBack }: Props) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      balance: 0,
      type,
      availableCredit: 0,
    },
  });

  function onSubmit(data: AccountFormValues) {
    console.log("🚀 ~ onSubmit ~ data:", data);
    onSuccess(data);
  }

  return (
    <form
      id="account-creation-form"
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-4 px-4 pb-4"
    >
      <FieldGroup>
        {/* Account Name */}
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="account-creation-form-name">
                Account name
              </FieldLabel>
              <Input
                {...field}
                id="account-creation-form-name"
                className="text-xs"
                placeholder={type === "credit" ? "Amex Platinum" : "TD Bank"}
                autoComplete="off"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Balance */}
        <Controller
          name="balance"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="account-creation-form-balance">
                Opening balance
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  {...field}
                  id="account-creation-form-balance"
                  type="number"
                  placeholder="0.00"
                  className="text-xs"
                />
                <InputGroupAddon>
                  <DollarSignIcon />
                </InputGroupAddon>
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Account Type */}
        <Controller
          name="type"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="account-creation-form-type">
                Account type
              </FieldLabel>
              <Input
                id="account-creation-form-type"
                className="capitalize"
                type="text"
                value={field.value}
                disabled
              />
            </Field>
          )}
        />

        {/* Credit-only fields */}
        {type === "credit" && (
          <div className="grid grid-cols-2 gap-3">
            {/* Available Credit */}
            <Controller
              name="availableCredit"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="account-creation-form-available-credit">
                    Credit limit
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id="account-creation-form-available-credit"
                      type="number"
                      placeholder="5000.00"
                      className="text-xs"
                    />
                    <InputGroupAddon>
                      <DollarSignIcon />
                    </InputGroupAddon>
                  </InputGroup>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Expiration Date */}
            <Controller
              name="expirationDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="date-picker-trigger">
                    Expiration date
                  </FieldLabel>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger
                      render={
                        <Button
                          id="date-picker-trigger"
                          variant="outline"
                          className="w-full justify-between font-normal"
                        >
                          {field.value ? (
                            dayjs(field.value).format("MMMM DD, YYYY")
                          ) : (
                            <span className="text-muted-foreground">
                              Select a date
                            </span>
                          )}
                          <ChevronDownIcon data-icon="inline-end" />
                        </Button>
                      }
                    />
                    <PopoverContent
                      className="w-auto overflow-hidden p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={field.value}
                        defaultMonth={field.value}
                        captionLayout="dropdown"
                        onSelect={(date) => {
                          field.onChange(date ?? null);
                          setCalendarOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
        )}
      </FieldGroup>

      <div className="flex flex-col gap-2 pt-2">
        <Button type="submit" className="w-full">
          Create account
        </Button>
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
      </div>
    </form>
  );
}
