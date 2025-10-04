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
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { sanitizeNumber, sanitizeText } from "@/lib/utils";

interface Expense {
  id: string;
  date: string; // ISO Date
  amount: number; // store numeric then format
  category: string;
  description: string;
  attachmentName?: string;
  status: "pending" | "approved" | "rejected" | "reimbursed";
}

const Employee = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const categories = ["Travel", "Meals", "Supplies", "Software", "Training", "Other"];

  const [formData, setFormData] = useState<{
    amount: string;
    description: string;
    date: string;
    category: string;
    attachment: File | null;
  }>({
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    category: "Travel",
    attachment: null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description || !formData.date) {
      toast.error("Please fill in all required fields");
      return;
    }

    const sanitizedDescription = sanitizeText(formData.description, { max: 1000 });
    const sanitizedCategory = sanitizeText(formData.category, { max: 40 });
    const amtNum = parseFloat(sanitizeNumber(formData.amount));
    if (isNaN(amtNum) || amtNum <= 0) {
      toast.error("Invalid amount");
      return;
    }
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      date: formData.date,
      amount: amtNum,
      category: sanitizedCategory,
      description: sanitizedDescription,
      attachmentName: formData.attachment?.name,
      status: "pending",
    };
    setExpenses([newExpense, ...expenses]);
    setFormData({ amount: "", description: "", date: new Date().toISOString().split("T")[0], category: "Travel", attachment: null });
    toast.success("Expense submitted");
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Employee Portal</h1>
        <p className="text-muted-foreground">Submit new expenses and track their approval status.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New Expense</CardTitle>
            <CardDescription>Enter details below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input id="amount" type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attachment">Attachment</Label>
                  <div className="flex items-center gap-2">
                    <Input id="attachment" type="file" onChange={(e) => setFormData({ ...formData, attachment: e.target.files?.[0] || null })} />
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {formData.attachment && <p className="text-xs text-muted-foreground truncate">{formData.attachment.name}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required placeholder="Describe the expense" />
              </div>
              <Button type="submit" className="w-full">Submit</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent (Latest 5)</CardTitle>
            <CardDescription>Most recent expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenses.slice(0, 5).map((expense) => (
                <div key={expense.id} className="flex justify-between items-start p-3 border rounded-md">
                  <div className="space-y-1">
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-xs text-muted-foreground">{expense.category} • {expense.date}</p>
                    <p className="text-xs font-semibold text-primary">${expense.amount.toFixed(2)}</p>
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
          <CardDescription>History of your submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Attachment</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.date}</TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell className="max-w-xs truncate" title={expense.description}>{expense.description}</TableCell>
                  <TableCell>${expense.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{expense.attachmentName || '—'}</TableCell>
                  <TableCell><StatusBadge status={expense.status} /></TableCell>
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
