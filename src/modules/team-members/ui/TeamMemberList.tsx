import dayjs from "dayjs";
import { ArrowUpDown, Plus, Search, Users } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { paginationSchema } from "@/shared/api/schema";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  TABLE_VISIBILITY_STORAGE_KEYS,
  useApiSorting,
  convertToApiSorting,
} from "@/shared/ui/data-table";
import DataTable from "@/shared/ui/data-table/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import EditActions from "@/shared/ui/edit-actions";
import { Guarded } from "@/shared/ui/guarded";
import { Input } from "@/shared/ui/input";
import { Navbar } from "@/shared/ui/navbar/navbar";
import { Spinner } from "@/shared/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

import { useGetStaffList, useDeleteStaff } from "../model/use-staff";

import StaffFormDialog from "./components/StaffFormDialog";

import type { TStaffUser } from "../model/schema";
import type { TLeafKey } from "@/shared/i18n/types";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";

const TeamMemberList = () => {
  const { t } = useTranslation();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0, // 0-based
    pageSize: paginationSchema.parse({}).limit,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedMember, setSelectedMember] = useState<TStaffUser | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TStaffUser | null>(null);

  const { sorting, setSorting } = useApiSorting({
    defaultSort: [{ id: "created_at", desc: true }],
    onSortChange: useCallback(() => {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, []),
  });

  const apiSortingParams = convertToApiSorting(sorting);
  const { data: staffResponse, isLoading } = useGetStaffList({
    page: pagination.pageIndex + 1, // convert to 1-based
    limit: pagination.pageSize,
    ...apiSortingParams,
  });

  const deleteStaffMutation = useDeleteStaff();

  const filteredData = useMemo(() => {
    if (!staffResponse?.data) return [];
    if (!searchTerm.trim()) return staffResponse.data;

    const lowercaseSearch = searchTerm.toLowerCase();
    return staffResponse.data.filter((staff) => {
      const fullName = `${staff.first_name} ${staff.last_name}`.toLowerCase();
      return (
        staff.staff_id.toLowerCase().includes(lowercaseSearch) ||
        staff.account.toLowerCase().includes(lowercaseSearch) ||
        fullName.includes(lowercaseSearch) ||
        staff.role.toLowerCase().includes(lowercaseSearch)
      );
    });
  }, [staffResponse?.data, searchTerm]);

  const handleCreateMember = () => {
    setFormMode("create");
    setSelectedMember(null);
    setFormOpen(true);
  };

  const handleEditMember = (member: TStaffUser) => {
    setFormMode("edit");
    setSelectedMember(member);
    setFormOpen(true);
  };

  const handleDeleteMember = (member: TStaffUser) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;

    try {
      await deleteStaffMutation.mutateAsync(memberToDelete.staff_id);
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const columns: ColumnDef<TStaffUser>[] = [
    {
      accessorKey: "staff_id",
      enableHiding: true,
      meta: {
        displayName: t("team-members.staffId"),
      },
      header: () => <h4>{t("team-members.staffId")}</h4>,
      cell: ({ row }) => {
        const staffId = row.getValue<string>("staff_id");
        const isLongId = staffId.length > 15;

        return (
          <div className="text-center">
            {isLongId ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="max-w-[120px] cursor-pointer font-mono text-sm">
                      {staffId}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-mono text-sm">{staffId}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <p className="font-mono text-sm">{staffId}</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "account",
      enableHiding: true,
      meta: {
        displayName: t("team-members.account"),
      },
      header: () => <h4>{t("team-members.account")}</h4>,
      cell: ({ row }) => {
        return (
          <p className="text-center font-medium">{row.getValue("account")}</p>
        );
      },
    },
    {
      accessorKey: "email",
      enableHiding: true,
      meta: {
        displayName: t("team-members.email"),
      },
      header: () => <h4>{t("team-members.email")}</h4>,
      cell: ({ row }) => {
        return <p className="text-center">{row.getValue("email")}</p>;
      },
    },
    {
      id: "name",
      enableHiding: true,
      meta: {
        displayName: t("team-members.name"),
      },
      header: () => <h4>{t("team-members.name")}</h4>,
      cell: ({ row }) => {
        const firstName = row.original.first_name;
        const lastName = row.original.last_name;
        return <p className="text-center">{`${firstName} ${lastName}`}</p>;
      },
    },
    {
      accessorKey: "role",
      enableHiding: true,
      meta: {
        displayName: t("team-members.role"),
      },
      header: () => <h4>{t("team-members.role")}</h4>,
      cell: ({ row }) => {
        const role = row.getValue<string>("role").toLowerCase();
        return (
          <div className="text-center">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold",
                {
                  "bg-yellow-300 text-orange-700": role === "superadmin",
                  "bg-red-100 text-red-800": role === "admin",
                  "bg-green-100 text-green-800": role === "cservice",
                  "bg-gray-100 text-gray-800": ![
                    "superadmin",
                    "admin",
                    "cservice",
                  ].includes(role),
                }
              )}
            >
              {t(`team-members.roles.${role}` as TLeafKey)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      enableSorting: true,
      enableHiding: true,
      meta: {
        displayName: t("team-members.createdAt"),
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("team-members.createdAt")}
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-center text-sm text-gray-600">
          {dayjs(row.getValue("created_at")).format("YYYY-MM-DD HH:mm")}
        </div>
      ),
    },
    {
      accessorKey: "updated_at",
      enableSorting: true,
      enableHiding: true,
      meta: {
        displayName: t("team-members.updatedAt"),
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("team-members.updatedAt")}
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-center text-sm text-gray-600">
          {dayjs(row.getValue("updated_at")).format("YYYY-MM-DD HH:mm")}
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: true,
      meta: {
        displayName: t("team-members.actions"),
      },
      header: () => (
        <h4 className="text-center">{t("team-members.actions")}</h4>
      ),
      cell: ({ row }) => {
        const staff = row.original;
        return (
          <EditActions
            onEdit={{
              handler: () => handleEditMember(staff),
              permission: "team-members:update",
            }}
            onDelete={{
              handler: () => handleDeleteMember(staff),
              permission: "team-members:delete",
            }}
          />
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex size-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Spinner className="size-8" />
          <p className="text-gray-500">{t("team-members.loadingStaffList")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex size-full flex-col">
      <Navbar />
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="size-6" />
            <h2 className="text-2xl font-bold tracking-tight">
              {t("team-members.staffManagement")}
            </h2>
          </div>
          <Guarded permission="team-members:create">
            <Button onClick={handleCreateMember}>
              <Plus className="mr-2 size-4" />
              {t("team-members.createStaff")}
            </Button>
          </Guarded>
        </div>

        <div className="flex items-center space-x-2">
          <Search className="size-4 text-gray-400" />
          <Input
            placeholder={t("team-members.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <DataTable
          columns={columns}
          data={filteredData}
          pagination={{
            state: pagination,
            onPaginationChange: setPagination,
            total: staffResponse?.total ?? 0,
          }}
          enableColumnVisibility={true}
          columnVisibilityStorageKey={
            TABLE_VISIBILITY_STORAGE_KEYS.TEAM_MEMBERS_TABLE
          }
          columnVisibilityAlign="start"
          sorting={sorting}
          onSortingChange={setSorting}
        />
      </div>

      <StaffFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        staff={selectedMember}
        mode={formMode}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("team-members.confirmDelete")}</DialogTitle>
            <DialogDescription>
              {t("team-members.deleteConfirmMessage", {
                name: memberToDelete
                  ? `${memberToDelete.first_name} ${memberToDelete.last_name}`
                  : "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteStaffMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteStaffMutation.isPending}
            >
              {deleteStaffMutation.isPending && (
                <Spinner className="mr-2 size-4" />
              )}
              {t("team-members.confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamMemberList;
