import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Eye } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { sanitizeText } from "@/lib/utils";
import { expensesApi, usersApi } from "@/lib/api";
// Helper to get current user from localStorage (from login response)
function getCurrentUser() {
  try {
    let user = localStorage.getItem("auth_user");
    if (!user) user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

interface ReviewExpense {
  id: string;
  requester: string;
  date: string; // ISO date
  category: string;
  description: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
}


const Manager = () => {
  const [expenses, setExpenses] = useState<ReviewExpense[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch expenses on mount
  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
          toast.error("User not found. Please log in again.");
          setLoading(false);
          return;
        }
        // Fetch all users
        const usersRes = await usersApi.list();
        // Filter employees who report to this manager
        const employees = usersRes.users.filter((u: any) => u.role === "employee" && u.manager_id === currentUser.id);
        let allExpenses: any[] = [];
        // For each employee, fetch their expenses
        for (const emp of employees) {
          try {
            const empRes = await expensesApi.list({ user_id: emp.id });
            allExpenses.push(...empRes.expenses.map((exp: any) => ({
              id: String(exp.id),
              requester: emp.full_name || emp.email || "-",
              date: exp.created_at ? exp.created_at.split("T")[0] : "-",
              category: exp.category || "-",
              description: exp.description,
              amount: parseFloat(exp.amount),
              status: exp.status,
            })));
          } catch (err: any) {
            if (err.status !== 403) toast.error("Failed to load employee's expenses");
          }
        }
        setExpenses(allExpenses);
      } catch (err: any) {
        if (err.status === 403) toast.error("You are not allowed to view these expenses.");
        else toast.error("Failed to load expenses");
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, []);

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await expensesApi.approve(Number(id), status);
      setExpenses(prev => prev.map(e => e.id === id ? { ...e, status } : e));
      toast.success(`Expense ${status}`);
    } catch (err: any) {
      toast.error(`Failed to ${status} expense`);
    }
  };

  const downloadAttachment = (exp: ReviewExpense) => {
    // Placeholder dummy file (in real app fetch actual file URL)
    const content = `Expense Detail\nRequester: ${exp.requester}\nDate: ${exp.date}\nCategory: ${exp.category}\nDescription: ${exp.description}\nAmount: ${exp.amount}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense_${exp.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manager Portal</h1>
        <p className="text-muted-foreground">Review and approve expense requests from your team</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Expenses</CardTitle>
          <CardDescription>Review submitted expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requester</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map(exp => (
                <TableRow key={exp.id}>
                  <TableCell className="font-medium">{exp.requester}</TableCell>
                  <TableCell>{exp.date}</TableCell>
                  <TableCell>{exp.category}</TableCell>
                  <TableCell className="max-w-xs truncate" title={exp.description}>{exp.description}</TableCell>
                  <TableCell>${exp.amount.toFixed(2)}</TableCell>
                  <TableCell><StatusBadge status={exp.status} /></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="h-8 px-2">
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl">
                          <DialogHeader>
                            <DialogTitle>Expense #{exp.id}</DialogTitle>
                            <DialogDescription>Submitted by {exp.requester} on {exp.date}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-3 gap-2">
                              <span className="font-medium">Category:</span>
                              <span className="col-span-2">{exp.category}</span>
                              <span className="font-medium">Amount:</span>
                              <span className="col-span-2">${exp.amount.toFixed(2)}</span>
                              <span className="font-medium">Status:</span>
                              <span className="col-span-2 capitalize">{exp.status}</span>
                            </div>
                            <div>
                              <p className="font-medium mb-1">Description</p>
                              <p className="whitespace-pre-wrap border rounded p-2 bg-muted/40 max-h-56 overflow-auto text-xs">
                                {sanitizeText(exp.description, { max: 5000 })}
                              </p>
                            </div>
                          </div>
                          <DialogFooter className="mt-4 flex flex-row justify-between sm:justify-between">
                            <div className="flex gap-2">
                              {exp.status === 'pending' && (
                                <>
                                  <Button size="sm" onClick={() => updateStatus(exp.id, 'approved')}>
                                    <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => updateStatus(exp.id, 'rejected')}>
                                    <XCircle className="h-4 w-4 mr-1" /> Reject
                                  </Button>
                                </>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="secondary" onClick={() => downloadAttachment(exp)}>
                                Download
                              </Button>
                              <DialogClose asChild>
                                <Button size="sm" variant="outline">Close</Button>
                              </DialogClose>
                            </div>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      {exp.status === 'pending' ? (
                        <>
                          <Button size="sm" className="h-8 px-2" onClick={() => updateStatus(exp.id, 'approved')}>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" className="h-8 px-2" onClick={() => updateStatus(exp.id, 'rejected')}>
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
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

export default Manager;
