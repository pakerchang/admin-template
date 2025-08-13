import { useNavigate } from "@tanstack/react-router";
import dayjs from "dayjs";
import { ArrowUpDown, UserCog } from "lucide-react";
import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";

import DataTable from "@/components/shared/DataTable";
import EditActions from "@/components/shared/EditActions";
import { Navbar } from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { generateUserData } from "@/services/contracts/mock-data";
import { paginationSchema } from "@/services/types/schema";

import EditUserRoleDialogContent from "./components/EditUserRoleDialogContent";
import { useUserPermissions, useUpdateUserRole } from "./hooks/use-user";

import type { TUser, TUserRole } from "@/services/contracts/user";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";

const UserList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { canEditUserRole } = useUserPermissions();
  const { mutate: updateUserRole } = useUpdateUserRole();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0, // 0-based
    pageSize: paginationSchema.parse({}).limit,
  });

  const [openEditRoleDialog, setOpenEditRoleDialog] = useState(false);
  const targetUserId = useRef<TUser["user_id"]>("");
  const targetUserRole = useRef<TUser["role"]>("user");

  const mockUser = generateUserData();

  const onOpenEditRoleDialog = (id: TUser["user_id"], role: TUser["role"]) => {
    setOpenEditRoleDialog(true);
    targetUserId.current = id;
    targetUserRole.current = role;
  };

  const handleRoleSubmit = (userId: string) => (role: TUserRole) => {
    updateUserRole({
      target_user_id: userId,
      role: role,
    });
    setOpenEditRoleDialog(false);
  };

  const columns: ColumnDef<TUser>[] = [
    {
      accessorKey: "user_id",
      enableHiding: true,
      header: () => <h4>{t("table.headers.user.userId")}</h4>,
      cell: ({ row }) => {
        return <p className="text-center">{row.getValue("user_id")}</p>;
      },
    },
    {
      accessorKey: "role",
      enableSorting: true,
      enableHiding: false,
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("table.headers.user.role")}
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        return <p className="text-center">{row.getValue("role")}</p>;
      },
    },
    {
      id: "name",
      enableHiding: false,
      header: () => <h4>{t("table.headers.user.name")}</h4>,
      cell: ({ row }) => {
        const firstName = row.original.first_name;
        const lastName = row.original.last_name;
        return <p className="text-center">{`${firstName} ${lastName}`}</p>;
      },
    },
    {
      accessorKey: "phone_number",
      enableHiding: false,
      header: () => <h4>{t("table.headers.user.phoneNumber")}</h4>,
      cell: ({ row }) => {
        return <p className="text-center">{row.getValue("phone_number")}</p>;
      },
    },
    {
      accessorKey: "email",
      enableHiding: false,
      header: () => <h4>{t("table.headers.user.email")}</h4>,
      cell: ({ row }) => {
        return <p className="text-center">{row.getValue("email")}</p>;
      },
    },
    {
      accessorKey: "created_at",
      enableSorting: true,
      enableHiding: false,
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("table.headers.createdAt")}
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        return (
          <div className="text-center">
            {dayjs(row.getValue("created_at")).format("YYYY-MM-DD HH:mm")}
          </div>
        );
      },
    },
    {
      accessorKey: "updated_at",
      enableSorting: true,
      enableHiding: false,
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("table.headers.updatedAt")}
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        return (
          <div className="text-center">
            {dayjs(row.getValue("updated_at")).format("YYYY-MM-DD HH:mm")}
          </div>
        );
      },
    },
    {
      accessorKey: "actions",
      enableHiding: false,
      header: () => <h4 className="">{t("table.headers.order.actions")}</h4>,
      cell: ({ row }) => {
        const id = row.getValue<TUser["user_id"]>("user_id");
        const role = row.original.role;
        return (
          <EditActions
            onEdit={() => navigate({ to: "/users/edit/$id", params: { id } })}
          >
            {canEditUserRole && (
              <Button
                key={id}
                variant="outline"
                onClick={() => onOpenEditRoleDialog(id, role)}
              >
                <UserCog size={16} />
              </Button>
            )}
          </EditActions>
        );
      },
    },
  ];

  return (
    <div className="flex size-full flex-col gap-4">
      <Navbar />
      <div className="p-4">
        <DataTable
          columns={columns}
          data={mockUser}
          pagination={{
            state: pagination,
            onPaginationChange: setPagination,
            total: paginationSchema.parse({}).limit,
          }}
        />
      </div>
      <Dialog open={openEditRoleDialog} onOpenChange={setOpenEditRoleDialog}>
        <EditUserRoleDialogContent
          defaultRole={targetUserRole.current}
          onSubmit={handleRoleSubmit(targetUserId.current)}
        />
      </Dialog>
    </div>
  );
};

export default UserList;
