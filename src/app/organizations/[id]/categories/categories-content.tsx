"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";

interface CategoryFormData {
  name: string;
  description: string;
}

export function CategoriesContent({
  organizationId,
}: {
  organizationId: string;
}) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{
    id: string;
    name: string;
    description: string | null;
  } | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
  });

  const utils = api.useUtils();
  const [organization] = api.organization.getOrganization.useSuspenseQuery({
    organizationId,
  });
  const [categories] = api.category.list.useSuspenseQuery({ organizationId });

  const isAdmin = organization.currentUserRole === "ADMIN";

  const createCategory = api.category.create.useMutation({
    onSuccess: async () => {
      await utils.category.list.invalidate();
      setCreateDialogOpen(false);
      setFormData({ name: "", description: "" });
    },
  });

  const updateCategory = api.category.update.useMutation({
    onSuccess: async () => {
      await utils.category.list.invalidate();
      setEditDialogOpen(false);
      setEditingCategory(null);
    },
  });

  const deleteCategory = api.category.delete.useMutation({
    onSuccess: async () => {
      await utils.category.list.invalidate();
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createCategory.mutate({
      organizationId,
      name: formData.name,
      description: formData.description || undefined,
    });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    updateCategory.mutate({
      id: editingCategory.id,
      name: formData.name,
      description: formData.description || undefined,
    });
  };

  const openEditDialog = (category: {
    id: string;
    name: string;
    description: string | null;
  }) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description ?? "",
    });
    setEditDialogOpen(true);
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Expense Categories</h1>
        {isAdmin && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Category</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Create Category</DialogTitle>
                  <DialogDescription>
                    Add a new expense category for your organization
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Travel"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (optional)</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Travel and transportation expenses"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createCategory.isPending}>
                    {createCategory.isPending ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
                {createCategory.error && (
                  <p className="text-sm text-destructive mt-2">
                    {createCategory.error.message}
                  </p>
                )}
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Categories Yet</CardTitle>
            <CardDescription>
              {isAdmin
                ? "Create your first expense category to get started"
                : "No categories have been created yet"}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{category.name}</CardTitle>
                    {category.description && (
                      <CardDescription>{category.description}</CardDescription>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(category)}
                      >
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Category</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &quot;{category.name}&quot;?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                deleteCategory.mutate({ id: category.id })
                              }
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {isAdmin && editingCategory && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <form onSubmit={handleEdit}>
              <DialogHeader>
                <DialogTitle>Edit Category</DialogTitle>
                <DialogDescription>
                  Update the category information
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">
                    Description (optional)
                  </Label>
                  <Input
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateCategory.isPending}>
                  {updateCategory.isPending ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
              {updateCategory.error && (
                <p className="text-sm text-destructive mt-2">
                  {updateCategory.error.message}
                </p>
              )}
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
