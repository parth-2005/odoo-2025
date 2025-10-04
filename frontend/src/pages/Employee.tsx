import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { Upload } from "lucide-react";

interface Expense {
  id: string;
  date: string;
  amount: string;
  purpose: string;
  document: string;
  status: "pending" | "approved" | "reimbursed" | "rejected";
}

const Employee = () => {
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: "1",
      date: "2025-03-15",
      amount: "$120.00",
      purpose: "Client meeting lunch",
      document: "receipt_001.pdf",
      status: "approved",
    },
    {
      id: "2",
      date: "2025-03-10",
      amount: "$450.00",
      purpose: "Conference registration",
      document: "invoice_002.pdf",
      status: "reimbursed",
    },
    {
      id: "3",
      date: "2025-03-08",
      amount: "$85.00",
      purpose: "Office supplies",
      document: "receipt_003.pdf",
      status: "pending",
    },
  ]);

  const [formData, setFormData] = useState({
    amount: "",
    purpose: "",
    document: null as File | null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.purpose) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newExpense: Expense = {
      id: String(expenses.length + 1),
      date: new Date().toISOString().split("T")[0],
      amount: `$${parseFloat(formData.amount).toFixed(2)}`,
      purpose: formData.purpose,
      document: formData.document?.name || "No document",
      status: "pending",
    };

    setExpenses([newExpense, ...expenses]);
    setFormData({ amount: "", purpose: "", document: null });
    toast.success("Expense submitted successfully");
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Employee Portal</h1>
        <p className="text-muted-foreground">Submit and track your expense requests</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Submit New Expense</CardTitle>
            <CardDescription>Fill in the details of your expense claim</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Textarea
                  id="purpose"
                  placeholder="Describe the purpose of this expense"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  required
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document">Proof Document</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="document"
                    type="file"
                    onChange={(e) =>
                      setFormData({ ...formData, document: e.target.files?.[0] || null })
                    }
                    className="cursor-pointer"
                  />
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
                {formData.document && (
                  <p className="text-sm text-muted-foreground">{formData.document.name}</p>
                )}
              </div>

              <Button type="submit" className="w-full">
                Submit Expense
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>Track the status of your expense claims</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenses.slice(0, 3).map((expense) => (
                <div key={expense.id} className="flex justify-between items-start p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{expense.purpose}</p>
                    <p className="text-sm text-muted-foreground">{expense.date}</p>
                    <p className="text-sm font-semibold text-primary">{expense.amount}</p>
                  </div>
                  <StatusBadge status={expense.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>All Expenses</CardTitle>
          <CardDescription>Complete history of your expense submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.date}</TableCell>
                  <TableCell>{expense.amount}</TableCell>
                  <TableCell>{expense.purpose}</TableCell>
                  <TableCell className="text-muted-foreground">{expense.document}</TableCell>
                  <TableCell>
                    <StatusBadge status={expense.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Employee;
