import { useMediaQuery } from "@/hooks/use-media-query";
import { toast } from "sonner";
import type { Category } from "@workspace/types";
import { useDeleteCategory } from "@/features/categories/api/use-categories";
import { cn } from "@workspace/ui/lib/utils";

import { Button } from "@workspace/ui/components/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
}

export function DeleteCategoryDialog({ open, onOpenChange, category }: Props) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const deleteCategory = useDeleteCategory();

  function handleClose() {
    onOpenChange(false);
  }

  function handleDelete() {
    if (!category) return;

    deleteCategory.mutate(category.id, {
      onSuccess: () => {
        toast.success("Category deleted");
        handleClose();
      },
      onError: (err) => {
        toast.error(err.message || "Failed to delete category");
      },
    });
  }

  const title = "Are you absolutely sure?";
  const description =
    "This action will unlink all associated transactions. Those transactions will be marked as uncategorized and won't be counted in category reports. This action cannot be undone.";

  if (isDesktop) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-left">{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <DeleteContent
            categoryName={category?.name}
            isPending={deleteCategory.isPending}
            onCancel={handleClose}
            onDelete={handleDelete}
          />
        </AlertDialogContent>
      </AlertDialog>
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
        <DeleteContent
          categoryName={category?.name}
          isPending={deleteCategory.isPending}
          onCancel={handleClose}
          onDelete={handleDelete}
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

interface DeleteContentProps {
  categoryName?: string;
  isPending: boolean;
  onCancel: () => void;
  onDelete: () => void;
  className?: string;
}

function DeleteContent({
  categoryName,
  isPending,
  onCancel,
  onDelete,
  className,
}: DeleteContentProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {categoryName && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
          <p className="text-sm font-medium">
            Delete &ldquo;{categoryName}&rdquo;?
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2 md:hidden">
        <Button
          type="button"
          variant="destructive"
          onClick={onDelete}
          disabled={isPending}
          className="w-full"
        >
          {isPending ? "Deleting..." : "Delete"}
        </Button>
      </div>

      <div className="hidden justify-end gap-2 md:flex">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onDelete}
          disabled={isPending}
        >
          {isPending ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </div>
  );
}
