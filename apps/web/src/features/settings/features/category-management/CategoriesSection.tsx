import { useState } from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import type {
  Category,
  CategoryType,
  CategoryWithSubcategories,
} from "@workspace/types";
import { useCategories } from "@/features/categories/api/use-categories";

import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Button } from "@workspace/ui/components/button";
import { Spinner } from "@workspace/ui/components/spinner";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
} from "@workspace/ui/components/item";
import { DropdownMenuItem } from "@workspace/ui/components/dropdown-menu";

import { CollapsibleGroup } from "@/components/CollapsibleGroup";
import { AddCategoryDialog } from "./AddCategoryDialog";
import { EditCategoryDialog } from "./EditCategoryDialog";
import { DeleteCategoryDialog } from "./DeleteCategoryDialog";

export function CategoriesSection() {
  const [activeTab, setActiveTab] = useState<CategoryType>("EXPENSE");
  const { data: categories, isPending } = useCategories({ type: activeTab });

  const [addOpen, setAddOpen] = useState(false);
  const [addParentId, setAddParentId] = useState<string | undefined>();
  const [addParentName, setAddParentName] = useState<string | undefined>();

  const [editOpen, setEditOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as CategoryType)}
        >
          <TabsList>
            <TabsTrigger value="EXPENSE">Expense</TabsTrigger>
            <TabsTrigger value="INCOME">Income</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={handleAddCategory}>Add</Button>
      </div>

      {isPending ? (
        <div className="flex justify-center py-12">
          <Spinner className="size-6 text-muted-foreground" />
        </div>
      ) : !categories?.length ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No {activeTab.toLowerCase()} categories yet.
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {(categories as CategoryWithSubcategories[]).map((cat) => {
            const subs = cat.subcategories ?? [];
            return (
              <CollapsibleGroup
                key={cat.id}
                id={cat.id}
                label={cat.name}
                count={subs.length}
                actions={
                  <>
                    <DropdownMenuItem onClick={() => handleAddSubcategory(cat)}>
                      <PlusIcon />
                      Add
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(cat)}>
                      <PencilIcon />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => handleDeleteRequest(cat)}
                    >
                      <Trash2Icon />
                      Delete
                    </DropdownMenuItem>
                  </>
                }
              >
                {subs.length === 0 ? (
                  <p className="px-2 py-1 text-xs text-muted-foreground">
                    No subcategories.
                  </p>
                ) : (
                  <ItemGroup className="flex flex-col gap-1">
                    {subs.map((sub) => (
                      <Item key={sub.id} variant="muted" size="xs">
                        <ItemContent>{sub.name}</ItemContent>
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
                  </ItemGroup>
                )}
              </CollapsibleGroup>
            );
          })}
        </div>
      )}

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

      <DeleteCategoryDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        category={deleteTarget}
      />
    </div>
  );
}
