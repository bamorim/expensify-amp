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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export function ExpensesContent({
  organizationId,
}: {
  organizationId: string;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: "",
    amount: "",
    date: new Date().toISOString().split("T")[0]!,
    description: "",
  });

  const utils = api.useUtils();
  const [expenses] = api.expense.listMy.useSuspenseQuery({ organizationId });
  const [categories] = api.category.list.useSuspenseQuery({ organizationId });

  const submitExpense = api.expense.submit.useMutation({
    onSuccess: async () => {
      await utils.expense.listMy.invalidate();
      setDialogOpen(false);
      setFormData({
        categoryId: "",
        amount: "",
        date: new Date().toISOString().split("T")[0]!,
        description: "",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitExpense.mutate({
      organizationId,
      categoryId: formData.categoryId,
      amount: parseFloat(formData.amount),
      date: new Date(formData.date),
      description: formData.description,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-600">Approved</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      case "PENDING":
        return <Badge variant="secondary">Pending Review</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Expenses</h1>
          <p className="text-muted-foreground">
            Submit and track your expense reimbursements
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Submit Expense</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Submit Expense</DialogTitle>
                <DialogDescription>
                  Request reimbursement for a business expense
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
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    placeholder="100.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Client dinner in NYC"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitExpense.isPending}>
                  {submitExpense.isPending ? "Submitting..." : "Submit"}
                </Button>
              </DialogFooter>
              {submitExpense.error && (
                <p className="text-sm text-destructive mt-2">
                  {submitExpense.error.message}
                </p>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {expenses.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Expenses Yet</CardTitle>
            <CardDescription>
              Submit your first expense to get started
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {expenses.map((expense) => (
            <Card key={expense.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">
                        {expense.description}
                      </CardTitle>
                      {getStatusBadge(expense.status)}
                    </div>
                    <CardDescription className="flex items-center gap-4">
                      <span>{expense.category.name}</span>
                      <span>•</span>
                      <span>${expense.amount.toFixed(2)}</span>
                      <span>•</span>
                      <span>{new Date(expense.date).toLocaleDateString()}</span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
