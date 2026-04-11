import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { toast } from "sonner";
import type { Category } from "@workspace/types";
import { useUpdateCategory } from "@/features/categories/api/use-categories";
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

// Form schema for category editing
const EditCategoryFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
});

type EditCategoryFormData = z.infer<typeof EditCategoryFormSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
}

export function EditCategoryDialog({ open, onOpenChange, category }: Props) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const updateCategory = useUpdateCategory();

  const form = useForm<EditCategoryFormData>({
    resolver: zodResolver(EditCategoryFormSchema),
    defaultValues: {
      name: "",
    },
  });

  // Update form when category changes
  useEffect(() => {
    if (category) {
      form.reset({ name: category.name });
    }
  }, [category, form]);

  function handleClose() {
    onOpenChange(false);
  }

  function onSubmit(data: EditCategoryFormData) {
    if (!category) return;

    updateCategory.mutate(
      { id: category.id, data: { name: data.name.trim() } },
      {
        onSuccess: () => {
          toast.success("Category updated");
          handleClose();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to update category");
        },
      }
    );
  }

  const title = "Edit category";
  const description = "Update the category name.";

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <EditForm
            form={form}
            onSubmit={onSubmit}
            onCancel={handleClose}
            isPending={updateCategory.isPending}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <EditForm
          form={form}
          onSubmit={onSubmit}
          onCancel={handleClose}
          isPending={updateCategory.isPending}
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

interface EditFormProps {
  form: ReturnType<typeof useForm<EditCategoryFormData>>;
  onSubmit: (data: EditCategoryFormData) => void;
  onCancel: () => void;
  isPending: boolean;
  className?: string;
}

function EditForm({
  form,
  onSubmit,
  onCancel,
  isPending,
  className,
}: EditFormProps) {
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
            autoComplete="off"
            autoFocus
          />
          {form.formState.errors.name && (
            <FieldError>{form.formState.errors.name.message}</FieldError>
          )}
        </Field>
      </FieldGroup>

      <div className="flex justify-end gap-2 md:hidden">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="hidden justify-end gap-2 md:flex">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
