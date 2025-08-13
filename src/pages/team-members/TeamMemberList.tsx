import dayjs from "dayjs";
import { ArrowUpDown, Edit, Plus, Search, Trash2, Users } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";

import DataTable from "@/components/shared/DataTable";
import { Navbar } from "@/components/shared/Navbar";
import {
  TABLE_VISIBILITY_STORAGE_KEYS,
  useApiSorting,
  convertToApiSorting,
} from "@/components/shared/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { paginationSchema } from "@/services/types/schema";

import StaffFormDialog from "./components/StaffFormDialog";
import { useGetStaffList, useDeleteStaff } from "./hooks/use-staff";

import type { TStaffUser } from "@/services/contracts/staff";
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
        displayName: t("staff.staffId"),
      },
      header: () => <h4>{t("staff.staffId")}</h4>,
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
        displayName: t("staff.account"),
      },
      header: () => <h4>{t("staff.account")}</h4>,
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
        displayName: t("staff.email"),
      },
      header: () => <h4>{t("staff.email")}</h4>,
      cell: ({ row }) => {
        return <p className="text-center">{row.getValue("email")}</p>;
      },
    },
    {
      id: "name",
      enableHiding: true,
      meta: {
        displayName: t("staff.name"),
      },
      header: () => <h4>{t("staff.name")}</h4>,
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
        displayName: t("staff.role"),
      },
      header: () => <h4>{t("staff.role")}</h4>,
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
              {t(`staff.roles.${role}`)}
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
        displayName: t("staff.createdAt"),
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("staff.createdAt")}
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
        displayName: t("staff.updatedAt"),
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("staff.updatedAt")}
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
        displayName: t("staff.actions"),
      },
      header: () => <h4 className="text-center">{t("staff.actions")}</h4>,
      cell: ({ row }) => {
        const staff = row.original;
        return (
          <div className="flex justify-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditMember(staff)}
                  >
                    <Edit className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("staff.editStaff")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMember(staff)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("staff.deleteStaff")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex size-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Spinner className="size-8" />
          <p className="text-gray-500">{t("staff.loadingStaffList")}</p>
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
              {t("staff.staffManagement")}
            </h2>
          </div>
          <Button onClick={handleCreateMember}>
            <Plus className="mr-2 size-4" />
            {t("staff.createStaff")}
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Search className="size-4 text-gray-400" />
          <Input
            placeholder={t("staff.searchPlaceholder")}
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
            <DialogTitle>{t("staff.confirmDelete")}</DialogTitle>
            <DialogDescription>
              {t("staff.deleteConfirmMessage", {
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
              {t("staff.confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamMemberList;
