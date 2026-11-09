import { useNavigate } from "@tanstack/react-router";
import dayjs from "dayjs";
import { ArrowUpDown, Pencil, UserCog } from "lucide-react";
import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Navbar } from "@/components/shared/Navbar";
import { paginationSchema } from "@/shared/api/schema";
import { Button } from "@/shared/ui/button";
import DataTable from "@/shared/ui/data-table/data-table";
import { Dialog } from "@/shared/ui/dialog";

import EditUserRoleDialogContent from "./components/EditUserRoleDialogContent";
import { useGetUserList, useUpdateUserRole } from "./hooks/use-user";

import type { TUser, TUserRole } from "@/services/schemas/user";
import type { TRowAction } from "@/shared/ui/data-table/row-actions";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";

const UserList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { mutate: updateUserRole } = useUpdateUserRole();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0, // 0-based
    pageSize: paginationSchema.parse({}).limit,
  });

  const [openEditRoleDialog, setOpenEditRoleDialog] = useState(false);
  const targetUserId = useRef<TUser["user_id"]>("");
  const targetUserRole = useRef<TUser["role"]>("user");

  const { data: userList, isLoading } = useGetUserList({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

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
  ];

  // §6.4：權限宣告在操作上，DataTable 依 grants 過濾（取代 canEditUserRole &&）
  const rowActions: TRowAction<TUser>[] = [
    {
      id: "edit",
      label: t("common.edit"),
      icon: Pencil,
      permission: "users:update",
      onSelect: ({ user_id: id }) =>
        navigate({ to: "/users/edit/$id", params: { id } }),
    },
    {
      id: "edit-role",
      label: t("table.headers.user.role"),
      icon: UserCog,
      permission: "users:update-role",
      onSelect: ({ user_id, role }) => onOpenEditRoleDialog(user_id, role),
    },
  ];

  return (
    <div className="flex size-full flex-col gap-4">
      <Navbar />
      <div className="p-4">
        <DataTable
          columns={columns}
          rowActions={rowActions}
          rowActionsHeader={<h4>{t("table.headers.order.actions")}</h4>}
          data={userList?.data ?? []}
          isLoading={isLoading}
          pagination={{
            state: pagination,
            onPaginationChange: setPagination,
            total: userList?.total ?? 0,
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
