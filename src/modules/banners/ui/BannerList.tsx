import { useNavigate } from "@tanstack/react-router";
import { Reorder } from "framer-motion";
import { Plus } from "lucide-react";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { paginationSchema } from "@/shared/api/schema";
import { toast } from "@/shared/lib/use-toast";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Guarded } from "@/shared/ui/guarded";
import { Navbar } from "@/shared/ui/navbar/navbar";
import Paper from "@/shared/ui/paper";
import { Spinner } from "@/shared/ui/spinner";

import { useDeleteBanner, useGetBannerList } from "../model/use-banner";
import { useBannerSort } from "../model/use-banner-sort";

import { ImageCard } from "./components/ImageCard";

import type { TBanner } from "../model/schema";

const DEFAULT_ACTIVE_BANNER_LIMIT = 3;

const BannerList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [page, setPage] = useState(paginationSchema.parse({}).page);
  const [limit] = useState(paginationSchema.parse({}).limit);
  const [bannerToDelete, setBannerToDelete] = useState<TBanner | null>(null);
  const deleteBannerMutation = useDeleteBanner();

  const { data: bannerData } = useGetBannerList({
    page,
    limit,
  });

  const activeBanners = useMemo(() => {
    return bannerData?.activeBanners || [];
  }, [bannerData]);

  const inactiveBanners = useMemo(() => {
    return bannerData?.inactiveBanners || [];
  }, [bannerData]);

  const {
    sortedActiveBanners,
    isPromoting,
    isUpdating,
    isReordering,
    isDemoting,
    handleReorder,
    finalizeDragReorder,
    promoteToActive,
    removeFromActive,
  } = useBannerSort(activeBanners, inactiveBanners);

  const total = useMemo(() => {
    return bannerData?.total || 0;
  }, [bannerData]);

  // 合併操作狀態 - 用於整體 UI 禁用
  const hasAnyOperation = useMemo(
    () => isUpdating || isReordering,
    [isUpdating, isReordering]
  );

  // 拖拽動畫配置 - 基於可靠的狀態
  const dragAnimationConfig = useMemo(() => {
    if (hasAnyOperation) return {};
    return {
      scale: 1.05,
      rotate: 2,
      zIndex: 50,
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    };
  }, [hasAnyOperation]);

  // 懸停動畫配置 - 基於可靠的狀態
  const hoverAnimationConfig = useMemo(() => {
    if (hasAnyOperation) return {};
    return {
      scale: 1.02,
    };
  }, [hasAnyOperation]);

  const totalPages = Math.ceil(total / limit);

  const handlePrevPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handleEdit = (banner: TBanner) => {
    if (hasAnyOperation) {
      toast({
        title: t("toast.banner.operationConflict.title"),
        description: t("toast.banner.operationConflict.generalDescription"),
        variant: "destructive",
      });
      return;
    }

    navigate({
      to: "/banners/edit/$id",
      params: { id: banner.banner_id },
    });
  };

  const handleDelete = (banner: TBanner) => {
    if (hasAnyOperation) {
      toast({
        title: t("toast.banner.operationConflict.title"),
        description: t("toast.banner.operationConflict.generalDescription"),
        variant: "destructive",
      });
      return;
    }
    setBannerToDelete(banner);
  };

  const confirmDelete = async () => {
    if (!bannerToDelete) return;
    // 成功 / 失敗 toast 與列表 invalidate 由 useDeleteBanner 處理
    await deleteBannerMutation.mutateAsync(bannerToDelete.banner_id);
    setBannerToDelete(null);
  };

  const handlePromoteToActive = (banner: TBanner) => {
    if (sortedActiveBanners.length >= DEFAULT_ACTIVE_BANNER_LIMIT) {
      return toast({
        title: t("toast.banner.promoteToActive.error"),
        description: t("toast.banner.promoteToActive.errorDescription", {
          limit: DEFAULT_ACTIVE_BANNER_LIMIT,
        }),
        variant: "destructive",
      });
    }

    promoteToActive(banner);
  };

  const handleDemoteToInactive = async (banner: TBanner) => {
    await removeFromActive(banner);
  };

  const activeCard = (banner: TBanner) => (
    <ImageCard
      src={banner.desktop_image_url.file_url}
      alt={banner.title}
      isActive={true}
      sortOrder={banner.sort_order}
      onEdit={() => handleEdit(banner)}
      onDelete={() => handleDelete(banner)}
      onDemoteToInactive={() => handleDemoteToInactive(banner)}
      isDemoting={isDemoting}
      isUpdating={isUpdating}
      isReordering={isReordering}
    />
  );

  return (
    <div className="flex size-full flex-col gap-4">
      <Navbar>
        <Guarded permission="banners:create">
          <Button
            variant="default"
            size="default"
            disabled={hasAnyOperation}
            onClick={() => {
              navigate({
                to: "/banners/create",
              });
            }}
          >
            <Plus className="mr-1 size-4" />
            {t("pages.banner.addBanner")}
          </Button>
        </Guarded>
      </Navbar>

      <div className="flex size-full flex-col gap-4 p-4">
        <Paper className="flex h-fit w-full flex-col gap-4 border">
          <h2 className="text-2xl font-bold">
            {t("pages.banner.activeTitle")} ({sortedActiveBanners.length}/
            {DEFAULT_ACTIVE_BANNER_LIMIT})
          </h2>

          {sortedActiveBanners.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/10">
              <div className="text-center text-muted-foreground">
                <p className="text-lg font-medium">
                  {t("pages.banner.emptyState.noActiveBanner")}
                </p>
                <p className="text-sm">
                  {t("pages.banner.emptyState.promoteBannerHint")}
                </p>
              </div>
            </div>
          ) : (
            // 排序寫入 = banners:update；無權限退回不可拖曳的 grid
            <Guarded
              permission="banners:update"
              fallback={
                <div className="grid w-full auto-cols-fr grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {sortedActiveBanners.map((banner) => (
                    <div key={banner.banner_id}>{activeCard(banner)}</div>
                  ))}
                </div>
              }
            >
              <Reorder.Group
                as="div"
                axis="x"
                values={sortedActiveBanners}
                onReorder={handleReorder}
                className={cn(
                  "relative grid w-full list-none auto-cols-fr grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
                  hasAnyOperation && "pointer-events-none opacity-75"
                )}
              >
                {sortedActiveBanners.map((banner) => (
                  <Reorder.Item
                    key={banner.banner_id}
                    value={banner}
                    className={cn(
                      "relative list-none",
                      hasAnyOperation
                        ? "cursor-not-allowed"
                        : "cursor-grab active:cursor-grabbing"
                    )}
                    layout
                    initial={{ scale: 1, rotate: 0 }}
                    animate={{ scale: 1, rotate: 0 }}
                    whileDrag={dragAnimationConfig}
                    whileHover={hoverAnimationConfig}
                    onDragEnd={finalizeDragReorder}
                    transition={{
                      layout: { duration: 0.2, ease: "easeInOut" },
                      default: { duration: 0.15, ease: "easeOut" },
                    }}
                  >
                    {activeCard(banner)}
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </Guarded>
          )}
        </Paper>

        <Paper className="flex h-fit w-full flex-col gap-4 border">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {t("pages.banner.inactiveTitle")}
            </h2>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={page === 1 || hasAnyOperation}
              >
                {t("table.pagination.previous")}
              </Button>

              <span className="text-sm text-muted-foreground">
                {t("table.pagination.pageInfo", {
                  currentPage: page,
                  totalPages,
                })}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={page >= totalPages || hasAnyOperation}
              >
                {t("table.pagination.next")}
              </Button>
            </div>
          </div>

          <div className="grid w-full auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {inactiveBanners.length > 0 ? (
              inactiveBanners
                .slice((page - 1) * limit, page * limit)
                .map((banner) => (
                  <ImageCard
                    key={banner.banner_id}
                    src={banner.desktop_image_url.file_url}
                    alt={banner.title}
                    isActive={false}
                    isPromoting={isPromoting === banner.banner_id}
                    onEdit={() => handleEdit(banner)}
                    onDelete={() => handleDelete(banner)}
                    onPromoteToActive={() => handlePromoteToActive(banner)}
                    isUpdating={isUpdating}
                    isReordering={isReordering}
                  />
                ))
            ) : (
              <div className="col-span-full flex h-[300px] items-center justify-center rounded-lg">
                <p className="text-center text-lg font-medium text-muted-foreground">
                  {t("pages.banner.emptyState.noActiveBanner")}
                </p>
              </div>
            )}
          </div>
        </Paper>
      </div>

      <Dialog
        open={bannerToDelete !== null}
        onOpenChange={(open) => !open && setBannerToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("pages.banner.deleteConfirm")}</DialogTitle>
            <DialogDescription>
              {t("pages.banner.deleteDescription", {
                name: bannerToDelete?.title,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBannerToDelete(null)}
              disabled={deleteBannerMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteBannerMutation.isPending}
            >
              {deleteBannerMutation.isPending && (
                <Spinner className="mr-2 size-4" />
              )}
              {t("pages.banner.confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BannerList;
