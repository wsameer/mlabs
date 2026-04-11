import { useState } from "react";
import { toast } from "sonner";
import {
  ChevronDownIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import type {
  Category,
  CategoryType,
  CategoryWithSubcategories,
} from "@workspace/types";
import {
  useCategories,
  useDeleteCategory,
} from "@/features/categories/api/use-categories";

import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Button } from "@workspace/ui/components/button";
import { Spinner } from "@workspace/ui/components/spinner";
import { ButtonGroup } from "@workspace/ui/components/button-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import {
  Item,
  ItemGroup,
  ItemContent,
  ItemActions,
} from "@workspace/ui/components/item";

import { AddCategoryDialog } from "./AddCategoryDialog";
import { EditCategoryDialog } from "./EditCategoryDialog";

export function CategoriesSection() {
  const [activeTab, setActiveTab] = useState<CategoryType>("EXPENSE");
  const { data: categories, isPending } = useCategories({ type: activeTab });

  // Add dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [addParentId, setAddParentId] = useState<string | undefined>();
  const [addParentName, setAddParentName] = useState<string | undefined>();

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const deleteCategory = useDeleteCategory();

  // Expanded parents
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAddCategory() {
    setAddParentId(undefined);
    setAddParentName(undefined);
    setAddOpen(true);
  }

  function handleAddSubcategory(parent: Category) {
    setAddParentId(parent.id);
    setAddParentName(parent.name);
    setAddOpen(true);
  }

  function handleEdit(category: Category) {
    setEditCategory(category);
    setEditOpen(true);
  }

  function handleDeleteRequest(category: Category) {
    setDeleteTarget(category);
    setDeleteOpen(true);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;

    deleteCategory.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Category deleted");
        setDeleteOpen(false);
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to delete category");
      },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tab selector + Add button */}
      <div className="flex items-center justify-between">
        <Tabs
          defaultValue={activeTab}
          onValueChange={(v) => v && setActiveTab(v as CategoryType)}
        >
          <TabsList>
            <TabsTrigger value="EXPENSE">Expense</TabsTrigger>
            <TabsTrigger value="INCOME">Income</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button size="sm" onClick={handleAddCategory}>
          <PlusIcon className="size-3.5" />
          Add
        </Button>
      </div>
      {/* Category list */}
      {isPending ? (
        <div className="flex justify-center py-12">
          <Spinner className="size-6 text-muted-foreground" />
        </div>
      ) : !categories?.length ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No {activeTab.toLowerCase()} categories yet.
        </div>
      ) : (
        <ItemGroup>
          {(categories as CategoryWithSubcategories[]).map((cat) => {
            const hasSubs = cat.subcategories && cat.subcategories.length > 0;
            const isExpanded = expanded.has(cat.id);

            return (
              <div key={cat.id} className="flex flex-col gap-2">
                {/* Parent row */}
                <Item variant="outline" size="sm">
                  {/* Expand toggle */}
                  {hasSubs && (
                    <button
                      type="button"
                      className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                      onClick={() => toggleExpand(cat.id)}
                    >
                      <ChevronDownIcon
                        className={`size-3.5 transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"}`}
                      />
                    </button>
                  )}

                  {/* Name */}
                  <ItemContent>
                    <span className="text-sm">{cat.name}</span>
                  </ItemContent>

                  {/* Actions */}
                  <ItemActions>
                    <ButtonGroup
                      aria-label="Category actions"
                      className="w-fit gap-0.5!"
                    >
                      <ButtonGroup>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Add subcategory"
                          onClick={() => handleAddSubcategory(cat)}
                        >
                          <PlusIcon className="size-3.5" />
                        </Button>
                      </ButtonGroup>
                      <ButtonGroup>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Edit"
                          onClick={() => handleEdit(cat)}
                        >
                          <PencilIcon className="size-3.5" />
                        </Button>
                      </ButtonGroup>
                      <ButtonGroup>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete"
                          onClick={() => handleDeleteRequest(cat)}
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </ButtonGroup>
                    </ButtonGroup>
                  </ItemActions>
                </Item>

                {/* Subcategories */}
                {hasSubs && isExpanded && (
                  <div className="flex flex-col gap-2 pl-8">
                    {cat.subcategories!.map((sub) => (
                      <Item key={sub.id} variant="outline" size="xs">
                        <ItemContent>
                          <span className="text-sm text-muted-foreground">
                            {sub.name}
                          </span>
                        </ItemContent>
                        <ItemActions>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit"
                            onClick={() => handleEdit(sub)}
                          >
                            <PencilIcon className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete"
                            onClick={() => handleDeleteRequest(sub)}
                          >
                            <Trash2Icon className="size-3.5" />
                          </Button>
                        </ItemActions>
                      </Item>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </ItemGroup>
      )}

      {/* Dialogs */}
      <AddCategoryDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        type={activeTab}
        parentId={addParentId}
        parentName={addParentName}
      />

      <EditCategoryDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        category={editCategory}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-left">
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action will unlink all associated transactions. Those
              transactions will be marked as uncategorized and won't be counted
              in category reports. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              variant="outline"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteCategory.isPending}
            >
              {deleteCategory.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
