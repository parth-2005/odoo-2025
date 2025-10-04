import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { CheckCircle2, XCircle, FileText } from "lucide-react";

interface PendingExpense {
  id: string;
  employeeName: string;
  department: string;
  date: string;
  amount: string;
  purpose: string;
  document: string;
  status: "pending" | "approved" | "rejected";
}

const Manager = () => {
  const [expenses, setExpenses] = useState<PendingExpense[]>([
    {
      id: "1",
      employeeName: "Sarah Johnson",
      department: "Marketing",
      date: "2025-03-18",
      amount: "$320.00",
      purpose: "Marketing materials for Q2 campaign",
      document: "receipt_m001.pdf",
      status: "pending",
    },
    {
      id: "2",
      employeeName: "Michael Chen",
      department: "Sales",
      date: "2025-03-17",
      amount: "$150.00",
      purpose: "Client dinner meeting",
      document: "receipt_m002.pdf",
      status: "pending",
    },
    {
      id: "3",
      employeeName: "Emma Davis",
      department: "IT",
      date: "2025-03-16",
      amount: "$540.00",
      purpose: "Software license renewal",
      document: "invoice_m003.pdf",
      status: "pending",
    },
    {
      id: "4",
      employeeName: "James Wilson",
      department: "Operations",
      date: "2025-03-15",
      amount: "$89.00",
      purpose: "Office supplies",
      document: "receipt_m004.pdf",
      status: "approved",
    },
  ]);

  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);

  const handleSelectExpense = (expenseId: string) => {
    setSelectedExpenses((prev) =>
      prev.includes(expenseId)
        ? prev.filter((id) => id !== expenseId)
        : [...prev, expenseId]
    );
  };

  const handleApprove = () => {
    if (selectedExpenses.length === 0) {
      toast.error("Please select at least one expense to approve");
      return;
    }

    setExpenses((prev) =>
      prev.map((expense) =>
        selectedExpenses.includes(expense.id)
          ? { ...expense, status: "approved" as const }
          : expense
      )
    );

    toast.success(`${selectedExpenses.length} expense(s) approved successfully`);
    setSelectedExpenses([]);
  };

  const handleReject = () => {
    if (selectedExpenses.length === 0) {
      toast.error("Please select at least one expense to reject");
      return;
    }

    setExpenses((prev) =>
      prev.map((expense) =>
        selectedExpenses.includes(expense.id)
          ? { ...expense, status: "rejected" as const }
          : expense
      )
    );

    toast.success(`${selectedExpenses.length} expense(s) rejected`);
    setSelectedExpenses([]);
  };

  const pendingExpenses = expenses.filter((e) => e.status === "pending");
  const processedExpenses = expenses.filter((e) => e.status !== "pending");

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manager Portal</h1>
        <p className="text-muted-foreground">Review and approve expense requests from your team</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>
                {pendingExpenses.length} expense(s) awaiting your review
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleApprove}
                disabled={selectedExpenses.length === 0}
                className="bg-success hover:bg-success/90"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve Selected
              </Button>
              <Button
                onClick={handleReject}
                disabled={selectedExpenses.length === 0}
                variant="destructive"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject Selected
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No pending expenses to review
                  </TableCell>
                </TableRow>
              ) : (
                pendingExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedExpenses.includes(expense.id)}
                        onCheckedChange={() => handleSelectExpense(expense.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{expense.employeeName}</TableCell>
                    <TableCell>{expense.department}</TableCell>
                    <TableCell>{expense.date}</TableCell>
                    <TableCell className="font-semibold">{expense.amount}</TableCell>
                    <TableCell>{expense.purpose}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{expense.document}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={expense.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recently Processed</CardTitle>
          <CardDescription>Expenses you have already reviewed</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No processed expenses yet
                  </TableCell>
                </TableRow>
              ) : (
                processedExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.employeeName}</TableCell>
                    <TableCell>{expense.department}</TableCell>
                    <TableCell>{expense.date}</TableCell>
                    <TableCell className="font-semibold">{expense.amount}</TableCell>
                    <TableCell>{expense.purpose}</TableCell>
                    <TableCell>
                      <StatusBadge status={expense.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Manager;
