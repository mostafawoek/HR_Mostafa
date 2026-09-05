import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function Register() {
  return (
    <AuthLayout
      icon={ShieldAlert}
      title="Account creation is restricted"
      subtitle="Only the system administrator can create user accounts."
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          Back to login
        </Link>
      }
    >
      <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
        Please contact the administrator of this HR system to receive your login credentials.
      </div>
    </AuthLayout>
  );
}
