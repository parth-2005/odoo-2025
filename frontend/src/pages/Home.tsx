import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, UserCheck, Users, ArrowRight } from "lucide-react";

const Home = () => {
  const roles = [
    {
      title: "Employee",
      description: "Submit and track your expense requests",
      icon: Receipt,
      path: "/employee",
      color: "text-primary",
    },
    {
      title: "Manager",
      description: "Review and approve team expense submissions",
      icon: UserCheck,
      path: "/manager",
      color: "text-success",
    },
    {
      title: "Admin",
      description: "Manage users and oversee all expenses",
      icon: Users,
      path: "/admin",
      color: "text-warning",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-accent/20">
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            Welcome to <span className="text-primary">ExpenseFlow</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Streamline your expense management with our intuitive platform. Submit, review, and
            approve expenses with ease.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Card
                key={role.path}
                className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <CardHeader>
                  <div className={`mb-4 ${role.color}`}>
                    <Icon className="h-12 w-12" />
                  </div>
                  <CardTitle className="text-2xl">{role.title}</CardTitle>
                  <CardDescription className="text-base">{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to={role.path}>
                    <Button className="w-full group">
                      Go to {role.title}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Employees Submit Expenses</h3>
                  <p className="text-muted-foreground">
                    Employees can easily submit expense claims with receipts and detailed descriptions.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-success text-success-foreground rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Managers Review & Approve</h3>
                  <p className="text-muted-foreground">
                    Managers review pending requests and approve or reject them with a single click.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-warning text-warning-foreground rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Admins Oversee Everything</h3>
                  <p className="text-muted-foreground">
                    Admins have full visibility across all departments and can manage user accounts.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;
