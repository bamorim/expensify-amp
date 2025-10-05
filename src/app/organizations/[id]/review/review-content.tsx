"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Textarea } from "~/components/ui/textarea";
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
} from "~/components/ui/dialog";
import { CheckCircle, XCircle } from "lucide-react";

export function ReviewContent({
  organizationId,
}: {
  organizationId: string;
}) {
  const [selectedExpense, setSelectedExpense] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState("");

  const utils = api.useUtils();
  const [expenses] = api.expense.listPending.useSuspenseQuery({
    organizationId,
  });

  const approveMutation = api.expense.approve.useMutation({
    onSuccess: async () => {
      await utils.expense.listPending.invalidate();
      setSelectedExpense(null);
    },
  });

  const rejectMutation = api.expense.reject.useMutation({
    onSuccess: async () => {
      await utils.expense.listPending.invalidate();
      setSelectedExpense(null);
      setRejectDialogOpen(false);
      setRejectComment("");
    },
  });

  const handleApprove = (expenseId: string) => {
    approveMutation.mutate({ expenseId });
  };

  const handleRejectClick = (expenseId: string) => {
    setSelectedExpense(expenseId);
    setRejectDialogOpen(true);
  };

  const handleRejectSubmit = () => {
    if (!selectedExpense) return;
    rejectMutation.mutate({
      expenseId: selectedExpense,
      comment: rejectComment || undefined,
    });
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Review Expenses</h1>
        <p className="text-muted-foreground">
          Approve or reject pending expense submissions
        </p>
      </div>

      {expenses.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Pending Expenses</CardTitle>
            <CardDescription>
              All expenses have been reviewed
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {expenses.map((expense) => (
            <Card key={expense.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">
                        {expense.description}
                      </CardTitle>
                      <Badge variant="secondary">Pending Review</Badge>
                    </div>
                    <CardDescription className="space-y-1">
                      <div className="flex items-center gap-4">
                        <span className="font-medium">{expense.user.name}</span>
                        <span>•</span>
                        <span>{expense.category.name}</span>
                        <span>•</span>
                        <span className="font-semibold text-lg">
                          ${expense.amount.toFixed(2)}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(expense.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm">
                        Submitted: {new Date(expense.createdAt).toLocaleString()}
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleApprove(expense.id)}
                      disabled={
                        approveMutation.isPending ||
                        rejectMutation.isPending
                      }
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRejectClick(expense.id)}
                      disabled={
                        approveMutation.isPending ||
                        rejectMutation.isPending
                      }
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Expense</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this expense (optional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="comment">Rejection Reason</Label>
              <Textarea
                id="comment"
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="e.g., Missing receipt, exceeds policy limit..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectComment("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject Expense"}
            </Button>
          </DialogFooter>
          {rejectMutation.error && (
            <p className="text-sm text-destructive mt-2">
              {rejectMutation.error.message}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
