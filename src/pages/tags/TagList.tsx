import { ArrowUpDown, Edit, Plus, Search, Tags, Trash2 } from "lucide-react";
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
import { paginationSchema } from "@/services/types/schema";

import TagFormDialog from "./components/TagFormDialog";
import { useGetTagList, useDeleteTag } from "./hooks/use-tag";

import type { TTag } from "@/services/contracts/tag";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";

const TagList = () => {
  const { t } = useTranslation();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0, // 0-based
    pageSize: paginationSchema.parse({}).limit,
  });
  const [searchTerm, setSearchTerm] = useState("");

  // 表單狀態
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedTag, setSelectedTag] = useState<TTag | null>(null);

  // 刪除確認對話框狀態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<TTag | null>(null);

  // API 排序狀態管理
  const { sorting, setSorting } = useApiSorting({
    onSortChange: useCallback(() => {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, []),
  });

  // 將排序狀態轉換為 API 參數
  const apiSortingParams = convertToApiSorting(sorting);

  // 獲取標籤列表數據
  const { data: tagResponse, isLoading } = useGetTagList({
    page: pagination.pageIndex + 1, // convert to 1-based
    limit: pagination.pageSize,
    ...(apiSortingParams.sort_by &&
      ["tag_id", "tag_name"].includes(apiSortingParams.sort_by) && {
        sort_by: apiSortingParams.sort_by as "tag_id" | "tag_name",
      }),
    ...(apiSortingParams.order && { order: apiSortingParams.order }),
  });

  const deleteTagMutation = useDeleteTag();

  // 前端搜索過濾，依據 tag_id 和 tag_name 欄位
  const filteredData = useMemo(() => {
    if (!tagResponse?.data) return [];
    if (!searchTerm.trim()) return tagResponse.data;

    const lowercaseSearch = searchTerm.toLowerCase();
    return tagResponse.data.filter((tag) => {
      return (
        tag.tag_id.toLowerCase().includes(lowercaseSearch) ||
        tag.tag_name.toLowerCase().includes(lowercaseSearch)
      );
    });
  }, [tagResponse?.data, searchTerm]);

  // 處理新增標籤
  const handleCreateTag = () => {
    setFormMode("create");
    setSelectedTag(null);
    setFormOpen(true);
  };

  // 處理編輯標籤
  const handleEditTag = (tag: TTag) => {
    setFormMode("edit");
    setSelectedTag(tag);
    setFormOpen(true);
  };

  // 處理刪除標籤
  const handleDeleteTag = (tag: TTag) => {
    setTagToDelete(tag);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!tagToDelete) return;

    try {
      await deleteTagMutation.mutateAsync({ tag_id: tagToDelete.tag_id });
      setDeleteDialogOpen(false);
      setTagToDelete(null);
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const columns: ColumnDef<TTag>[] = [
    {
      accessorKey: "tag_id",
      enableHiding: false,
      enableSorting: true,
      meta: {
        displayName: t("table.headers.tag.tagId"),
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("table.headers.tag.tagId")}
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const tagId = row.getValue("tag_id") as string;
        return (
          <div className="text-center">
            <p className="font-mono text-sm">{tagId}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "tag_name",
      enableSorting: true,
      enableHiding: true,
      meta: {
        displayName: t("table.headers.tag.tagName"),
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("table.headers.tag.tagName")}
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        return (
          <p className="text-center font-medium">{row.getValue("tag_name")}</p>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      meta: {
        displayName: t("table.headers.actions"),
      },
      header: () => (
        <h4 className="text-center">{t("table.headers.actions")}</h4>
      ),
      cell: ({ row }) => {
        const tag = row.original;
        return (
          <div className="flex justify-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditTag(tag)}
                  >
                    <Edit className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("pages.tag.editTag")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTag(tag)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("pages.tag.deleteTag")}</p>
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
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Spinner className="size-8" />
          <p className="text-gray-500">{t("pages.tag.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col">
      <Navbar />
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Tags className="size-6" />
            <h2 className="text-2xl font-bold tracking-tight">
              {t("dashboard.menu.tags.title")}
            </h2>
          </div>
          <Button onClick={handleCreateTag}>
            <Plus className="mr-2 size-4" />
            {t("pages.tag.addTag")}
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Search className="size-4 text-gray-400" />
          <Input
            placeholder={t("pages.tag.search.placeholder")}
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
            total: tagResponse?.total ?? 0,
          }}
          enableColumnVisibility={true}
          columnVisibilityStorageKey={TABLE_VISIBILITY_STORAGE_KEYS.TAGS_TABLE}
          columnVisibilityAlign="start"
          sorting={sorting}
          onSortingChange={setSorting}
        />
      </div>

      {/* 標籤表單對話框 */}
      <TagFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        tag={selectedTag}
        mode={formMode}
      />

      {/* 刪除確認對話框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("pages.tag.deleteConfirm")}</DialogTitle>
            <DialogDescription>
              {t("pages.tag.deleteDescription", {
                name: tagToDelete?.tag_name,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteTagMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteTagMutation.isPending}
            >
              {deleteTagMutation.isPending && (
                <Spinner className="mr-2 size-4" />
              )}
              {t("pages.tag.confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TagList;
