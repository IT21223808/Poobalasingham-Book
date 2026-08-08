import ERPLayout from "@/components/layout/ERPLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ERPLayout>{children}</ERPLayout>;
}