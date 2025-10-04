import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "pending" | "approved" | "reimbursed" | "rejected";
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const variants = {
    pending: "bg-pending/10 text-pending border-pending/20",
    approved: "bg-success/10 text-success border-success/20",
    reimbursed: "bg-success/20 text-success border-success/30",
    rejected: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const labels = {
    pending: "Pending",
    approved: "Approved",
    reimbursed: "Reimbursed",
    rejected: "Rejected",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variants[status],
        className
      )}
    >
      {labels[status]}
    </span>
  );
};
