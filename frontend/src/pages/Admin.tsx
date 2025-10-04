import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { UserPlus, Users as UsersIcon, Settings, Shield } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  password?: string;
}

interface ApprovalAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  approvers: string[];
  sequence: number;
  managerIsApprover: boolean;
}

const Admin = () => {
  const [users, setUsers] = useState<User[]>([
    { id: "1", name: "Sarah Johnson", email: "sarah.j@company.com", department: "Marketing", role: "Employee" },
    { id: "2", name: "Michael Chen", email: "michael.c@company.com", department: "Sales", role: "Employee" },
    { id: "3", name: "Emma Davis", email: "emma.d@company.com", department: "IT", role: "Manager" },
    { id: "4", name: "John Smith", email: "john.s@company.com", department: "Finance", role: "Approver" },
  ]);

  const [approvalAssignments, setApprovalAssignments] = useState<ApprovalAssignment[]>([
    {
      id: "1",
      employeeId: "1",
      employeeName: "Sarah Johnson",
      approvers: ["Emma Davis", "John Smith"],
      sequence: 1,
      managerIsApprover: true,
    },
    {
      id: "2",
      employeeId: "2",
      employeeName: "Michael Chen",
      approvers: ["John Smith"],
      sequence: 1,
      managerIsApprover: false,
    },
  ]);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    department: "",
    role: "Employee",
    password: "",
  });

  const [approvalSettings, setApprovalSettings] = useState({
    multiApproverRequired: false,
    minApprovalPercentage: 50,
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUser.name || !newUser.email || !newUser.department || !newUser.password) {
      toast.error("Please fill in all fields");
      return;
    }

    const user: User = {
      id: String(users.length + 1),
      ...newUser,
    };

    setUsers([...users, user]);
    setNewUser({ name: "", email: "", department: "", role: "Employee", password: "" });
    toast.success(`User created successfully. Password: ${user.password}`);
  };

  const employeeCount = users.filter(u => u.role === "Employee").length;
  const managerCount = users.filter(u => u.role === "Manager").length;
  const approverCount = users.filter(u => u.role === "Approver").length;

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Portal</h1>
        <p className="text-muted-foreground">Manage users and configure approval workflows</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeeCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Managers</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{managerCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approvers</CardTitle>
            <Shield className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approverCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Add New User</CardTitle>
            <CardDescription>Create a new user account with credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@company.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Set user password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="e.g., Marketing, Sales, IT"
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Employee">Employee</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Approver">Approver</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full">
                <UserPlus className="mr-2 h-4 w-4" />
                Create User
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approval Settings</CardTitle>
            <CardDescription>Configure approval workflow rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="multiApprover"
                checked={approvalSettings.multiApproverRequired}
                onCheckedChange={(checked) =>
                  setApprovalSettings({ ...approvalSettings, multiApproverRequired: checked as boolean })
                }
              />
              <Label htmlFor="multiApprover" className="cursor-pointer">
                Require multiple approvers
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minPercentage">Minimum Approval Percentage</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="minPercentage"
                  type="number"
                  min="1"
                  max="100"
                  value={approvalSettings.minApprovalPercentage}
                  onChange={(e) =>
                    setApprovalSettings({ ...approvalSettings, minApprovalPercentage: parseInt(e.target.value) })
                  }
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>

            <Button className="w-full">
              <Settings className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>All system users</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>
                      <span className="text-sm px-2 py-1 rounded-md bg-accent">
                        {user.role}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approval Assignments</CardTitle>
            <CardDescription>Configure who approves employee expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Approvers</TableHead>
                  <TableHead>Sequence</TableHead>
                  <TableHead>Manager</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvalAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.employeeName}</TableCell>
                    <TableCell>
                      <div className="text-sm">{assignment.approvers.join(", ")}</div>
                    </TableCell>
                    <TableCell>{assignment.sequence}</TableCell>
                    <TableCell>
                      {assignment.managerIsApprover ? (
                        <span className="text-success">Yes</span>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
