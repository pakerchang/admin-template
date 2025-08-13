import { useNavigate } from "@tanstack/react-router";
import dayjs from "dayjs";
import { Plus, ArrowUpDown } from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import DataTable from "@/components/shared/DataTable";
import EditActions from "@/components/shared/EditActions";
import { Navbar } from "@/components/shared/Navbar";
import { TABLE_VISIBILITY_STORAGE_KEYS } from "@/components/shared/table";
import {
  useApiSorting,
  convertToApiSorting,
} from "@/components/shared/table/hooks/useApiSorting";
import { Button } from "@/components/ui/button";
import { paginationSchema } from "@/services/types/schema";

import { useDeleteArticle, useGetArticleList } from "./hooks/use-article";

import type { TArticle } from "@/services/contracts/article";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";

const ArticleListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0, // 0-based
    pageSize: paginationSchema.parse({}).limit,
  });

  const { sorting, setSorting } = useApiSorting({
    onSortChange: useCallback(() => {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, []),
  });

  const articleApiParams = useMemo(() => {
    const baseParams = convertToApiSorting(sorting);
    if (!baseParams.sort_by || !baseParams.order) return {};

    return {
      sort_by: baseParams.sort_by,
      order: baseParams.order,
    };
  }, [sorting]);

  const {
    data: articleList,
    isLoading,
    isLoadingError,
  } = useGetArticleList({
    page: pagination.pageIndex + 1, // convert to 1-based
    limit: pagination.pageSize,
    ...articleApiParams,
  });
  const { mutate: deleteArticle } = useDeleteArticle();

  const onDeleteArticle = (id: string) => {
    deleteArticle(id);
  };

  const columns: ColumnDef<TArticle>[] = [
    {
      accessorKey: "article_id",
      enableHiding: true,
      enableSorting: true,
      meta: {
        displayName: t("table.headers.article.articleId"),
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("table.headers.article.articleId")}
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <p className="text-center font-mono text-sm">
          {row.getValue("article_id")}
        </p>
      ),
    },
    {
      accessorKey: "title",
      enableHiding: true,
      enableSorting: true,
      meta: {
        displayName: t("table.headers.article.title"),
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("table.headers.article.title")}
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <p className="max-w-[200px] truncate font-medium">
          {row.getValue("title")}
        </p>
      ),
    },
    {
      accessorKey: "describe",
      enableHiding: true,
      meta: {
        displayName: t("table.headers.article.description"),
      },
      header: () => (
        <h4 className="text-center">
          {t("table.headers.article.description")}
        </h4>
      ),
      cell: ({ row }) => {
        const description = row.getValue("describe") as string;
        return (
          <div className="flex items-center justify-center">
            <p className="w-fit truncate text-sm text-muted-foreground">
              {description || "-"}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "tags",
      enableHiding: true,
      meta: {
        displayName: t("table.headers.article.tags"),
      },
      header: () => (
        <h4 className="text-center">{t("table.headers.article.tags")}</h4>
      ),
      cell: ({ row }) => {
        const tags = row.getValue("tags") as string[];
        return (
          <div className="flex flex-wrap items-center justify-center gap-1">
            {tags?.length > 0 ? (
              tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">-</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "nick_name",
      enableHiding: true,
      enableSorting: true,
      meta: {
        displayName: t("table.headers.article.author"),
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("table.headers.article.author")}
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <p className="text-center">{row.getValue("nick_name")}</p>
      ),
    },
    {
      accessorKey: "created_at",
      enableHiding: true,
      enableSorting: true,
      meta: {
        displayName: t("table.headers.publishedAt"),
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("table.headers.publishedAt")}
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string;
        return (
          <p className="text-center text-sm">
            {dayjs(date).format("YYYY-MM-DD HH:mm")}
          </p>
        );
      },
    },
    {
      accessorKey: "updated_at",
      enableHiding: true,
      enableSorting: true,
      meta: {
        displayName: t("table.headers.updatedAt"),
      },
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
        const date = row.getValue("updated_at") as string;
        return (
          <p className="text-center text-sm">
            {dayjs(date).format("YYYY-MM-DD HH:mm")}
          </p>
        );
      },
    },
    {
      id: "actions",
      enableHiding: true,
      meta: {
        displayName: t("table.headers.article.actions"),
      },
      header: () => (
        <h4 className="text-center">{t("table.headers.article.actions")}</h4>
      ),
      cell: ({ row }) => {
        const id = row.original.article_id;
        return (
          <EditActions
            onEdit={() =>
              navigate({
                to: "/articles/edit/$id",
                params: { id },
              })
            }
            onDelete={() => onDeleteArticle(id)}
          />
        );
      },
    },
  ];

  return (
    <div className="flex size-full flex-col gap-4">
      <Navbar>
        <div className="flex w-full items-center justify-end">
          <Button
            onClick={() => {
              try {
                navigate({ to: "/articles/create" });
              } catch (error) {
                console.error("Navigation error:", error);
              }
            }}
          >
            <Plus className="size-4" />
            {t("common.createArticle")}
          </Button>
        </div>
      </Navbar>

      {!isLoading || !isLoadingError ? (
        <div className="p-4">
          <DataTable
            data={articleList?.data || []}
            columns={columns}
            isLoading={isLoading}
            pagination={{
              state: pagination,
              onPaginationChange: setPagination,
              total: articleList?.total ?? paginationSchema.parse({}).limit,
            }}
            sorting={sorting}
            onSortingChange={setSorting}
            enableColumnVisibility={true}
            columnVisibilityStorageKey={
              TABLE_VISIBILITY_STORAGE_KEYS.ARTICLES_TABLE
            }
            columnVisibilityAlign="start"
          />
        </div>
      ) : (
        <div className="flex size-full items-center justify-center">
          <p className="text-center text-black">{t("common.noData")}</p>
        </div>
      )}
    </div>
  );
};

export default ArticleListPage;
