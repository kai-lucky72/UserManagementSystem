
import { Layout } from "@/components/common/layout";
import { DataTable } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/utils";

export default function UsersPage() {
  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      return res.json();
    },
  });

  return (
    <Layout title="All Users">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">All Users</h1>
      </div>
      <DataTable data={users} columns={[
        { accessorKey: "firstName", header: "First Name" },
        { accessorKey: "lastName", header: "Last Name" },
        { accessorKey: "email", header: "Email" },
        { accessorKey: "role", header: "Role" },
        { accessorKey: "workId", header: "Work ID" }
      ]} />
    </Layout>
  );
}
