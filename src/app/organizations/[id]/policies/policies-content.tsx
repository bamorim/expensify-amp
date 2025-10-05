"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

interface PolicyFormData {
  categoryId: string;
  userId: string;
  maxAmount: string;
  requiresReview: boolean;
}

export function PoliciesContent({
  organizationId,
}: {
  organizationId: string;
}) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<{
    id: string;
    maxAmount: number;
    requiresReview: boolean;
  } | null>(null);
  const [formData, setFormData] = useState<PolicyFormData>({
    categoryId: "",
    userId: "org-wide",
    maxAmount: "",
    requiresReview: false,
  });

  const utils = api.useUtils();
  const [organization] = api.organization.getOrganization.useSuspenseQuery({
    organizationId,
  });
  const [policies] = api.policy.list.useSuspenseQuery({ organizationId });
  const [categories] = api.category.list.useSuspenseQuery({ organizationId });
  const [members] = api.organization.listMembers.useSuspenseQuery({
    organizationId,
  });

  const isAdmin = organization.currentUserRole === "ADMIN";

  const createPolicy = api.policy.create.useMutation({
    onSuccess: async () => {
      await utils.policy.list.invalidate();
      setCreateDialogOpen(false);
      setFormData({
        categoryId: "",
        userId: "org-wide",
        maxAmount: "",
        requiresReview: false,
      });
    },
  });

  const updatePolicy = api.policy.update.useMutation({
    onSuccess: async () => {
      await utils.policy.list.invalidate();
      setEditDialogOpen(false);
      setEditingPolicy(null);
    },
  });

  const deletePolicy = api.policy.delete.useMutation({
    onSuccess: async () => {
      await utils.policy.list.invalidate();
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoryId) {
      return;
    }

    createPolicy.mutate({
      organizationId,
      categoryId: formData.categoryId,
      userId: formData.userId === "org-wide" ? undefined : formData.userId,
      maxAmount: parseFloat(formData.maxAmount),
      requiresReview: formData.requiresReview,
    });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy) return;

    updatePolicy.mutate({
      id: editingPolicy.id,
      maxAmount: parseFloat(formData.maxAmount),
      requiresReview: formData.requiresReview,
    });
  };

  const openEditDialog = (policy: {
    id: string;
    maxAmount: number;
    requiresReview: boolean;
  }) => {
    setEditingPolicy(policy);
    setFormData({
      categoryId: "",
      userId: "",
      maxAmount: policy.maxAmount.toString(),
      requiresReview: policy.requiresReview,
    });
    setEditDialogOpen(true);
  };

  const groupedPolicies = categories.map((category) => {
    const categoryPolicies = policies.filter(
      (p) => p.categoryId === category.id,
    );
    return {
      category,
      policies: categoryPolicies,
    };
  });

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Policies</h1>
          <p className="text-muted-foreground">
            Define expense limits and approval requirements by category
          </p>
        </div>
        {isAdmin && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Policy</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Create Policy</DialogTitle>
                  <DialogDescription>
                    Set expense limits and approval rules for a category
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, categoryId: value })
                      }
                      required
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="user">User (optional)</Label>
                    <Select
                      value={formData.userId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, userId: value })
                      }
                    >
                      <SelectTrigger id="user">
                        <SelectValue placeholder="Organization-wide (all users)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="org-wide">
                          Organization-wide (all users)
                        </SelectItem>
                        {members.map((member) => (
                          <SelectItem key={member.userId} value={member.userId}>
                            {member.user.name ?? member.user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="maxAmount">Maximum Amount ($)</Label>
                    <Input
                      id="maxAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.maxAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, maxAmount: e.target.value })
                      }
                      placeholder="500.00"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="requiresReview"
                      checked={formData.requiresReview}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          requiresReview: e.target.checked,
                        })
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="requiresReview" className="font-normal">
                      Requires manual review
                    </Label>
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
                  <Button type="submit" disabled={createPolicy.isPending}>
                    {createPolicy.isPending ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
                {createPolicy.error && (
                  <p className="text-sm text-destructive mt-2">
                    {createPolicy.error.message}
                  </p>
                )}
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {groupedPolicies.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Categories Yet</CardTitle>
            <CardDescription>
              Create some expense categories first before adding policies
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedPolicies.map(({ category, policies: categoryPolicies }) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
                {category.description && (
                  <CardDescription>{category.description}</CardDescription>
                )}
              </CardHeader>
              <div className="px-6 pb-6">
                {categoryPolicies.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No policies defined for this category
                  </p>
                ) : (
                  <div className="space-y-2">
                    {categoryPolicies.map((policy) => (
                      <div
                        key={policy.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {policy.userId ? (
                              <Badge variant="secondary">
                                {policy.user?.name ?? policy.user?.email}
                              </Badge>
                            ) : (
                              <Badge>Organization-wide</Badge>
                            )}
                            {policy.requiresReview && (
                              <Badge variant="outline">Requires Review</Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium">
                            Max: ${policy.maxAmount.toFixed(2)}
                          </p>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(policy)}
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
                                  <AlertDialogTitle>
                                    Delete Policy
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this policy?
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      deletePolicy.mutate({ id: policy.id })
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
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {isAdmin && editingPolicy && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <form onSubmit={handleEdit}>
              <DialogHeader>
                <DialogTitle>Edit Policy</DialogTitle>
                <DialogDescription>
                  Update expense limits and approval requirements
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="edit-maxAmount">Maximum Amount ($)</Label>
                  <Input
                    id="edit-maxAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.maxAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, maxAmount: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-requiresReview"
                    checked={formData.requiresReview}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        requiresReview: e.target.checked,
                      })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="edit-requiresReview" className="font-normal">
                    Requires manual review
                  </Label>
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
                <Button type="submit" disabled={updatePolicy.isPending}>
                  {updatePolicy.isPending ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
              {updatePolicy.error && (
                <p className="text-sm text-destructive mt-2">
                  {updatePolicy.error.message}
                </p>
              )}
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
