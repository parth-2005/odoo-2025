// --- ALL IMPORTS MOVED TO THE TOP ---
import { useState, useEffect } from "react";
import { expensesApi, usersApi, flowsApi } from "@/lib/api";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator"; 
import { toast } from "sonner";
import { Users as UsersIcon, Shield, Edit, Send } from "lucide-react";

// --- INTERFACE DEFINITIONS ---

interface ExpenseRow {
  id: string;
  requester: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  status: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Employee' | 'Manager' | 'Admin';
}

// Represents the approval configuration FOR A SPECIFIC EMPLOYEE
interface ApprovalRule {
  employeeId: string;
  reportingManagerId: string | null; // Defines manager relationship
  role: 'Employee' | 'Manager' | 'Admin'; // User's role 
  isManagerApprover: boolean; // Is Manager Approver?
  approvers: {
    approverId: string;
    sequence: number; // For multi-level approvals
  }[];
  minApprovalPercentage: number | null; // Percentage rule
  isSequential: boolean; // Determines flow: sequential vs. parallel
}

// --- COMPONENT START ---

const Admin = () => {
  // Expense State
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseUserFilter, setExpenseUserFilter] = useState<string | null>(null);

  // User & Approval State
  const [users, setUsers] = useState<User[]>([]);
  const [approvalRules, setApprovalRules] = useState<ApprovalRule[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentRule, setCurrentRule] = useState<ApprovalRule | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- DATA FETCHING ---

  // Fetch all expenses or by user
  const fetchExpenses = async (userId?: string) => {
    setExpenseLoading(true);
    try {
      let params: { user_id?: number } | undefined = undefined;
      if (userId) {
        const numId = Number(userId);
        if (!isNaN(numId)) params = { user_id: numId };
      }
      const res = await expensesApi.list(params);
      setExpenses(res.expenses.map((exp: any) => ({
        id: String(exp.id),
        requester: exp.submitter_name || "-",
        date: exp.created_at ? exp.created_at.split("T")[0] : "-",
        category: exp.category || "-",
        description: exp.description,
        amount: parseFloat(exp.amount),
        status: exp.status,
      })));
    } catch (err: any) {
      toast.error("Failed to load expenses");
    } finally {
      setExpenseLoading(false);
    }
  };
  
  // Fetch users, approval flows, and initial expenses on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch users and flows in parallel
        const [usersRes, flowsRes] = await Promise.all([
            usersApi.list(),
            flowsApi.get()
        ]);

        setUsers(usersRes.users.map((u: any) => ({
          id: String(u.id),
          name: u.full_name,
          email: u.email,
          role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
        })));

        if (flowsRes.flow && flowsRes.flow.config && Array.isArray(flowsRes.flow.config)) {
          setApprovalRules(flowsRes.flow.config);
        } else {
          setApprovalRules([]);
        }

        // Fetch expenses after initial data load
        fetchExpenses();

      } catch (err: any) {
        toast.error("Failed to load initial admin data");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // --- DERIVED DATA & UTILITIES ---

  const managers = users.filter(u => u.role === 'Manager' || u.role === 'Admin');

  const getManagerName = (employeeId: string) => {
    const rule = approvalRules.find(r => r.employeeId === employeeId);
    if (!rule || !rule.reportingManagerId) return '-';
    return users.find(u => u.id === rule.reportingManagerId)?.name || 'Unknown Manager';
  };

  // --- HANDLERS ---

  const handleSendPassword = (user: User) => {
    toast.info(`Password reset link sent to ${user.email}`);
  };

  const openEditRulesDialog = (user: User) => {
    setSelectedUser(user);
    const rule = approvalRules.find(r => r.employeeId === user.id) || {
      employeeId: user.id,
      reportingManagerId: null,
      role: user.role,
      isManagerApprover: false,
      approvers: [],
      minApprovalPercentage: null,
      isSequential: false,
    };
    setCurrentRule(rule);
    setApprovalDialogOpen(true);
  };

  const handleDialogClose = () => {
    setApprovalDialogOpen(false);
    setSelectedUser(null);
    setCurrentRule(null);
  };

  const handleSaveRules = async () => {
    if (!currentRule) return;
    if (currentRule.isManagerApprover && !currentRule.reportingManagerId) {
      toast.error("A Reporting Manager must be assigned if 'Is Manager Approver' is checked.");
      return;
    }
    try {
      setLoading(true);
      const { employeeId, ...configObj } = currentRule;
      await flowsApi.upsert({ user_id: currentRule.employeeId, config: configObj });

      let newRules = [...approvalRules];
      const idx = newRules.findIndex(r => r.employeeId === currentRule.employeeId);
      if (idx > -1) newRules[idx] = currentRule;
      else newRules.push(currentRule);
      setApprovalRules(newRules);

      toast.success(`Approval rules saved for ${selectedUser?.name}`);
      handleDialogClose();
    } catch (err: any) {
      toast.error("Failed to save approval rules");
    } finally {
      setLoading(false);
    }
  };

  const handleAddApprover = (approverId: string) => {
    if (!currentRule) return;

    if (currentRule.approvers.some(a => a.approverId === approverId)) {
        toast.info("Approver is already in the list.");
        return;
    }
    
    if (currentRule.isManagerApprover && approverId === currentRule.reportingManagerId) {
        toast.info("Reporting Manager is already the first approver. Skipping addition to sequence.");
        return;
    }

    const newApprover = {
        approverId: approverId,
        sequence: currentRule.approvers.length + 1,
    };

    setCurrentRule({
        ...currentRule,
        approvers: [...currentRule.approvers, newApprover],
    });
  };

  const handleRemoveApprover = (idToRemove: string) => {
    if (!currentRule) return;

    const updatedApprovers = currentRule.approvers
      .filter(a => a.approverId !== idToRemove)
      .map((a, index) => ({ ...a, sequence: index + 1 }));

    setCurrentRule({
        ...currentRule,
        approvers: updatedApprovers,
    });
  };
  
  // --- DIALOG RENDER ---

  const renderApprovalRulesDialog = () => {
    if (!currentRule || !selectedUser) return null;

    const availableApprovers = users.filter(u => u.role === 'Manager' || u.role === 'Admin');

    return (
      <>
        <DialogHeader>
          <DialogTitle>Edit Approval Rules for {selectedUser.name}</DialogTitle>
          <DialogDescription>Define the manager relationship and multi-level approval workflow.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* User Details */}
          <div className="space-y-2">
            <Label htmlFor="user-name">User</Label>
            <Input id="user-name" value={selectedUser.name} readOnly className="font-semibold" />
          </div>

          <Separator />

          {/* Manager & Role */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={currentRule.role} onValueChange={(val) => setCurrentRule({ ...currentRule, role: val as 'Employee' | 'Manager' | 'Admin' })}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Employee">Employee</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager">Reporting Manager</Label>
              <Select
                value={currentRule.reportingManagerId || 'null-manager'}
                onValueChange={(val) => 
                  setCurrentRule({ ...currentRule, reportingManagerId: val === 'null-manager' ? null : val })
                }
              >
                <SelectTrigger id="manager">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null-manager">None</SelectItem> 
                  {managers.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                  id="isManagerApprover"
                  checked={currentRule.isManagerApprover}
                  onCheckedChange={(checked) =>
                      setCurrentRule({ ...currentRule, isManagerApprover: checked as boolean })
                  }
              />
          <Label htmlFor="isManagerApprover" className="cursor-pointer">
            Is Manager an Approver? <span className="text-muted-foreground text-xs">(If checked, Manager must approve first)</span>
          </Label>
          </div>

          <Separator />

          {/* Approval Flow */}
          <Card className="p-4 bg-muted/30">
              <CardTitle className="text-lg mb-4">Approval Flow</CardTitle>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="approverList">Add Approver to Flow</Label>
                  <Select onValueChange={handleAddApprover}>
                    <SelectTrigger id="approverList">
                      <SelectValue placeholder="Select an Approver" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableApprovers
                          .filter(a => 
                              a.id !== selectedUser.id && 
                              !(currentRule.isManagerApprover && a.id === currentRule.reportingManagerId)
                          )
                          .map(a => (
                            <SelectItem key={`add-${a.id}`} value={a.id}>
                              {a.name}
                            </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Checkbox
                      id="isSequential"
                      checked={currentRule.isSequential}
                      onCheckedChange={(checked) =>
                          setCurrentRule({ ...currentRule, isSequential: checked as boolean })
                      }
                  />
                  <Label htmlFor="isSequential" className="cursor-pointer">
                    Sequential Approval? <span className="text-muted-foreground text-xs">(Step 1 then Step 2)</span>
                  </Label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Current Approver Sequence:</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                    {currentRule.isManagerApprover && currentRule.reportingManagerId && (
                        <div className="flex justify-between items-center bg-blue-50/50 p-2 rounded-md border border-blue-200">
                            <span className="font-medium text-blue-800">
                                Step 1: {users.find(u => u.id === currentRule.reportingManagerId)?.name || 'Manager'} (Mandatory)
                            </span>
                            <span className="text-xs text-blue-600">Primary Approver</span>
                        </div>
                    )}
                    
                    {currentRule.approvers.length === 0 && (!currentRule.isManagerApprover || !currentRule.reportingManagerId) ? (
                        <p className="text-sm text-muted-foreground">No approvers defined.</p>
                    ) : (
                        currentRule.approvers
                            .sort((a, b) => a.sequence - b.sequence)
                            .map((approver, index) => {
                                const user = users.find(u => u.id === approver.approverId);
                                const displaySequence = currentRule.isSequential && currentRule.isManagerApprover && currentRule.reportingManagerId
                                    ? index + 2
                                    : index + 1;

                                return (
                                    <div key={approver.approverId} className="flex justify-between items-center bg-background p-2 rounded-md border">
                                        <span className="font-medium">
                                            {currentRule.isSequential ? `Step ${displaySequence}: ` : `Approver: `}
                                            {user?.name || 'Unknown User'} ({user?.role})
                                        </span>
                                        <Button 
                                          variant="destructive" 
                                          size="sm" 
                                          onClick={() => handleRemoveApprover(approver.approverId)}
                                        >
                                          Remove
                                        </Button>
                                    </div>
                                );
                            })
                    )}
                </div>
              </div>
          </Card>

          <Separator />

          {/* Conditional Approval */}
          <Card className="p-4 bg-muted/30">
              <CardTitle className="text-lg mb-4">Conditional Approval (Percentage Rule)</CardTitle>
              <div className="space-y-2">
                <Label htmlFor="minPercentage">Minimum Approval Percentage</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="minPercentage"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="e.g., 60 for 60%"
                    value={currentRule.minApprovalPercentage || ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setCurrentRule({ ...currentRule, minApprovalPercentage: isNaN(value) ? null : value });
                    }}
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">Applies only if multiple approvers are defined. Example: If 60% of approvers approve → Expense approved.</p>
              </div>
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={handleDialogClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSaveRules}>
            <Edit className="mr-2 h-4 w-4" />
            Save Rules
          </Button>
        </DialogFooter>
      </>
    );
  };

  // --- MAIN COMPONENT RENDER ---

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Portal</h1>
          <p className="text-muted-foreground">Manage users, expenses, and approval workflows.</p>
        </div>
        <div className="flex space-x-4">
            <Card className="p-4">
                <div className="text-sm font-medium flex items-center"><UsersIcon className="h-4 w-4 mr-2" /> Total Users</div>
                <div className="text-xl font-bold">{users.length}</div>
            </Card>
            <Card className="p-4">
                <div className="text-sm font-medium flex items-center"><Shield className="h-4 w-4 mr-2" /> Managers/Admins</div>
                <div className="text-xl font-bold">{users.filter(u => u.role === 'Manager' || u.role === 'Admin').length}</div>
            </Card>
        </div>
      </div>

      {/* Edit Rules Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          {renderApprovalRulesDialog()}
        </DialogContent>
      </Dialog>

      {/* User Management Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Define manager relationships and approval sequences for each user.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>User's Manager</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Send Password</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>
                    <span className={`text-sm px-2 py-1 rounded-md ${user.role === 'Admin' ? 'bg-red-100 text-red-800' : user.role === 'Manager' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>{getManagerName(user.id)}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="text-center">
                    <Button size="sm" variant="outline" onClick={() => handleSendPassword(user)}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button size="sm" variant="secondary" onClick={() => openEditRulesDialog(user)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Rules
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Expenses Table (Admin view) */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>All Expenses</CardTitle>
          <CardDescription>View and filter all expenses in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4 gap-4">
            <Label htmlFor="expense-user-filter">Filter by User:</Label>
            <Select
                value={expenseUserFilter || 'all'}
                onValueChange={val => {
                  setExpenseUserFilter(val === 'all' ? null : val);
                  fetchExpenses(val === 'all' ? undefined : val);
              }}
            >
              <SelectTrigger id="expense-user-filter" className="w-64">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="all">All Users</SelectItem>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {expenseLoading ? (
            <div className="text-center py-8">Loading expenses...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requester</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map(exp => (
                  <TableRow key={exp.id}>
                    <TableCell>{exp.requester}</TableCell>
                    <TableCell>{exp.date}</TableCell>
                    <TableCell>{exp.category}</TableCell>
                    <TableCell>{exp.description}</TableCell>
                    <TableCell>${exp.amount.toFixed(2)}</TableCell>
                    <TableCell>{exp.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default Admin;