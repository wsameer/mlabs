import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { toast } from "sonner";
import type { CategoryType } from "@workspace/types";
import { useCreateCategory } from "@/features/categories/api/use-categories";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@workspace/ui/lib/utils";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@workspace/ui/components/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";

// Form schema for category creation
const AddCategoryFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

type AddCategoryFormData = z.infer<typeof AddCategoryFormSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: CategoryType;
  parentId?: string;
  parentName?: string;
}

export function AddCategoryDialog({
  open,
  onOpenChange,
  type,
  parentId,
  parentName,
}: Props) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const createCategory = useCreateCategory();

  const form = useForm<AddCategoryFormData>({
    resolver: zodResolver(AddCategoryFormSchema),
    defaultValues: {
      name: "",
      isActive: true,
      sortOrder: 0,
    },
  });

  function handleClose() {
    onOpenChange(false);
    form.reset();
  }

  function onSubmit(data: AddCategoryFormData) {
    createCategory.mutate(
      {
        name: data.name.trim(),
        type,
        parentId: parentId ?? null,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
      {
        onSuccess: () => {
          toast.success(parentId ? "Subcategory created" : "Category created");
          handleClose();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to create category");
        },
      }
    );
  }

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const title = parentId
    ? `Add subcategory to ${parentName}`
    : `Add ${type.toLowerCase()} category`;

  const description = parentId
    ? "This will be nested under the parent category."
    : `Add a new ${type.toLowerCase()} category.`;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <CategoryForm
            form={form}
            onSubmit={onSubmit}
            isPending={createCategory.isPending}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-left">{title}</DrawerTitle>
          <DrawerDescription className="text-left">
            {description}
          </DrawerDescription>
        </DrawerHeader>
        <CategoryForm
          form={form}
          onSubmit={onSubmit}
          isPending={createCategory.isPending}
          className="px-4"
        />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

interface CategoryFormProps {
  form: ReturnType<typeof useForm<AddCategoryFormData>>;
  onSubmit: (data: AddCategoryFormData) => void;
  onCancel: () => void;
  isPending: boolean;
  className?: string;
}

function CategoryForm({
  form,
  onSubmit,
  isPending,
  className,
}: CategoryFormProps) {
  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-4", className)}
    >
      <FieldGroup>
        <Field data-invalid={!!form.formState.errors.name}>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            {...form.register("name")}
            placeholder="e.g. Groceries"
            autoComplete="off"
            autoFocus
          />
          {form.formState.errors.name && (
            <FieldError>{form.formState.errors.name.message}</FieldError>
          )}
        </Field>
      </FieldGroup>

      <div className="flex justify-end gap-2 md:hidden">
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Creating..." : "Create"}
        </Button>
      </div>

      <div className="hidden justify-end gap-2 md:flex">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create"}
        </Button>
      </div>
    </form>
  );
}
