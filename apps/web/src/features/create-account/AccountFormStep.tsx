import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { ACCOUNT_TYPES, type AccountType } from "./types";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@workspace/ui/components/input-group";
import { CalendarIcon, DollarSignIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Calendar } from "@workspace/ui/components/calendar";
import { useState } from "react";
import { formatDate, isValidDate } from "@/lib/format-date";

interface Props {
  type: AccountType;
  onSuccess: () => void;
  onBack: () => void;
}

const accountFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  balance: z.coerce.number(),
  type: z.enum(ACCOUNT_TYPES, { message: "Please select an account type" }),
  availableCredit: z.coerce.number().optional(),
  expirationDate: z.date().optional(),
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;

export function AccountFormStep({ type, onSuccess, onBack }: Props) {
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [month, setMonth] = useState<Date | undefined>(date);
  const [value, setValue] = useState(formatDate(date));

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      type,
      expirationDate: new Date(),
    },
  });

  async function onSubmit(data: AccountFormValues) {
    // Do something with the form values.
    console.log({ ...data, type });
    onSuccess();
  }

  return (
    <form
      id="account-creation-form"
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-4 p-0"
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
                aria-invalid={fieldState.invalid}
                placeholder="Example account name"
                autoComplete="off"
                required
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Account Balance */}
        <Controller
          name="balance"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="account-creation-form-balance">
                Balance on date
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  {...field}
                  id="account-creation-form-balance"
                  type="number"
                  placeholder="0.00"
                  className="text-xs"
                  required
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
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="account-creation-form-type">
                Account type
              </FieldLabel>
              <Select
                value={
                  field.value
                    ? field.value.charAt(0).toUpperCase() +
                      field.value?.slice(1)
                    : null
                }
                onValueChange={field.onChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={true}>
                  <SelectGroup>
                    {ACCOUNT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {type === "credit" && (
          <div className="grid grid-cols-2 gap-3">
            <Controller
              name="availableCredit"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="account-creation-form-available-credit">
                    Available Credits
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id="account-creation-form-available-credit"
                      type="number"
                      placeholder="1000"
                      className="text-xs"
                      required
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

            <Controller
              name="expirationDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="account-creation-form-expiration-date">
                    Expiration Date
                  </FieldLabel>
                  <InputGroup {...field}>
                    <InputGroupInput
                      id="account-creation-form-expiration-date"
                      placeholder="June 01, 2026"
                      className="text-xs"
                      value={value}
                      onChange={(e) => {
                        const date = new Date(e.target.value);
                        setValue(e.target.value);
                        if (isValidDate(date)) {
                          setDate(date);
                          setMonth(date);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setOpenDatePicker(true);
                        }
                      }}
                    />
                    <InputGroupAddon align="inline-end">
                      <Popover
                        open={openDatePicker}
                        onOpenChange={setOpenDatePicker}
                      >
                        <PopoverTrigger
                          render={
                            <InputGroupButton
                              id="date-picker"
                              variant="ghost"
                              size="icon-xs"
                              aria-label="Select date"
                            >
                              <CalendarIcon />
                              <span className="sr-only">Select date</span>
                            </InputGroupButton>
                          }
                        />
                        <PopoverContent
                          className="w-auto overflow-hidden p-0"
                          align="end"
                          alignOffset={-8}
                          sideOffset={10}
                        >
                          <Calendar
                            mode="single"
                            selected={date}
                            month={month}
                            onMonthChange={setMonth}
                            onSelect={(date) => {
                              setDate(date);
                              setValue(formatDate(date));
                              setOpenDatePicker(false);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </InputGroupAddon>
                  </InputGroup>
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
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" form="account-creation-form" className="w-full">
          Submit
        </Button>
      </div>
    </form>
  );
}
