import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useToast } from "@/hooks/use-toast";

import { useUpdateBanner } from "./use-banner";

import type { TBanner } from "@/services/contracts/banner";

type OperationType = "reorder" | "promote" | "demote";

interface OperationState {
  type: OperationType;
  isActive: boolean;
  bannerId?: string;
}

export const useBannerSort = (
  activeBanners: TBanner[],
  inactiveBanners: TBanner[]
) => {
  const { t } = useTranslation();

  const [operations, setOperations] = useState<
    Map<OperationType, OperationState>
  >(
    new Map([
      ["reorder", { type: "reorder", isActive: false }],
      ["promote", { type: "promote", isActive: false }],
      ["demote", { type: "demote", isActive: false }],
    ])
  );

  const [promotingBannerId, setPromotingBannerId] = useState<string | null>(
    null
  );
  const [reorderBanners, setReorderBanners] = useState<TBanner[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingReorder, setPendingReorder] = useState<TBanner[] | null>(null);

  const { toast } = useToast();
  const updateBannerMutation = useUpdateBanner();

  const operationLockRef = useRef(false);
  const reorderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hasActiveOperation = useCallback(() => {
    return (
      Array.from(operations.values()).some((op) => op.isActive) ||
      operationLockRef.current
    );
  }, [operations]);

  const setOperationState = useCallback(
    (type: OperationType, isActive: boolean, bannerId?: string) => {
      setOperations(
        (prev) => new Map(prev.set(type, { type, isActive, bannerId }))
      );
    },
    []
  );

  const getLatestActiveBannersSorted = useCallback(() => {
    if (activeBanners.length === 0) return [];

    return [...activeBanners].sort((a, b) => {
      if (a.sort_order === b.sort_order) {
        return (
          new Date(a.created_at || 0).getTime() -
          new Date(b.created_at || 0).getTime()
        );
      }
      return a.sort_order - b.sort_order;
    });
  }, [activeBanners]);

  useEffect(() => {
    const sortedBanners = getLatestActiveBannersSorted();
    setReorderBanners(sortedBanners);
  }, [getLatestActiveBannersSorted]);

  const sortedActiveBanners = reorderBanners;

  const executeReorderUpdate = useCallback(
    async (newOrder: TBanner[]) => {
      if (hasActiveOperation()) {
        return;
      }

      operationLockRef.current = true;
      setOperationState("reorder", true);
      setIsDragging(false);

      try {
        const updatePromises: Promise<unknown>[] = [];

        for (let i = 0; i < newOrder.length; i++) {
          const banner = newOrder[i];
          const newSortOrder = i + 1;

          if (banner.sort_order !== newSortOrder) {
            updatePromises.push(
              updateBannerMutation.mutateAsync({
                ...banner,
                sort_order: newSortOrder,
              })
            );
          }
        }

        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);

          toast({
            title: t("toast.banner.reorder.success"),
            description: t("toast.banner.reorder.success"),
            variant: "success",
          });
        }
      } catch (error) {
        if (error) {
          toast({
            title: t("toast.banner.reorder.error"),
            description: t("toast.banner.reorder.errorDescription"),
            variant: "destructive",
          });

          const originalOrder = getLatestActiveBannersSorted();
          setReorderBanners(originalOrder);
        }
      } finally {
        operationLockRef.current = false;
        setOperationState("reorder", false);
        setPendingReorder(null);
      }
    },
    [
      hasActiveOperation,
      updateBannerMutation,
      setOperationState,
      toast,
      getLatestActiveBannersSorted,
      t,
    ]
  );

  const handleReorder = useCallback(
    (newOrder: TBanner[]) => {
      if (hasActiveOperation()) {
        return;
      }

      setReorderBanners(newOrder);
      setIsDragging(true);
      setPendingReorder(newOrder);

      if (reorderTimeoutRef.current) {
        clearTimeout(reorderTimeoutRef.current);
      }

      reorderTimeoutRef.current = setTimeout(() => {
        executeReorderUpdate(newOrder);
      }, 500);
    },
    [hasActiveOperation, executeReorderUpdate]
  );

  const finalizeDragReorder = useCallback(() => {
    if (pendingReorder && !hasActiveOperation()) {
      if (reorderTimeoutRef.current) {
        clearTimeout(reorderTimeoutRef.current);
        reorderTimeoutRef.current = null;
      }

      executeReorderUpdate(pendingReorder);
    }
  }, [pendingReorder, hasActiveOperation, executeReorderUpdate]);

  useEffect(() => {
    return () => {
      if (reorderTimeoutRef.current) {
        clearTimeout(reorderTimeoutRef.current);
      }
    };
  }, []);

  const promoteToActive = useCallback(
    async (banner: TBanner) => {
      if (hasActiveOperation()) {
        toast({
          title: t("toast.banner.operationConflict.title"),
          description: t("toast.banner.operationConflict.promoteDescription"),
          variant: "destructive",
        });
        return false;
      }

      operationLockRef.current = true;
      setOperationState("promote", true, banner.banner_id);
      setPromotingBannerId(banner.banner_id);

      try {
        const latestActiveBanners = getLatestActiveBannersSorted();
        const nextSortOrder = latestActiveBanners.length + 1;

        await updateBannerMutation.mutateAsync({
          ...banner,
          banner_status: "active",
          sort_order: nextSortOrder,
        });

        toast({
          title: t("toast.banner.promoteToActive.success"),
          description: t("toast.banner.promoteToActive.success"),
          variant: "success",
        });

        return true;
      } catch (error) {
        if (error) {
          toast({
            title: t("toast.banner.promoteToActive.error"),
            description: t("toast.banner.promoteToActive.error"),
            variant: "destructive",
          });
        }

        return false;
      } finally {
        operationLockRef.current = false;
        setOperationState("promote", false);
        setPromotingBannerId(null);
      }
    },
    [
      hasActiveOperation,
      getLatestActiveBannersSorted,
      toast,
      updateBannerMutation,
      setOperationState,
      t,
    ]
  );

  const removeFromActive = useCallback(
    async (banner: TBanner) => {
      if (hasActiveOperation()) {
        toast({
          title: t("toast.banner.operationConflict.title"),
          description: t("toast.banner.operationConflict.demoteDescription"),
          variant: "destructive",
        });
        return false;
      }

      operationLockRef.current = true;
      setOperationState("demote", true, banner.banner_id);

      try {
        const latestActiveBanners = getLatestActiveBannersSorted();
        const targetSortOrder = banner.sort_order;

        const bannersToReorder = latestActiveBanners.filter(
          (b) =>
            b.sort_order > targetSortOrder && b.banner_id !== banner.banner_id
        );

        const updatePromises = [
          updateBannerMutation.mutateAsync({
            ...banner,
            banner_status: "inactive",
            sort_order: 9,
          }),
          ...bannersToReorder.map((b) =>
            updateBannerMutation.mutateAsync({
              ...b,
              sort_order: b.sort_order - 1,
            })
          ),
        ];

        await Promise.all(updatePromises);

        toast({
          title: t("toast.banner.removeFromActive.success"),
          description: t("toast.banner.removeFromActive.success"),
          variant: "success",
        });

        return true;
      } catch (error) {
        if (error) {
          toast({
            title: t("toast.banner.removeFromActive.error"),
            description: t("toast.banner.removeFromActive.error"),
            variant: "destructive",
          });
        }

        const originalOrder = getLatestActiveBannersSorted();
        setReorderBanners(originalOrder);

        return false;
      } finally {
        operationLockRef.current = false;
        setOperationState("demote", false);
      }
    },
    [
      hasActiveOperation,
      getLatestActiveBannersSorted,
      toast,
      updateBannerMutation,
      setOperationState,
      t,
    ]
  );

  return {
    sortedActiveBanners,
    inactiveBanners,
    isPromoting: promotingBannerId,
    isUpdating: updateBannerMutation.isPending,
    isReordering: operations.get("reorder")?.isActive || isDragging,
    isDemoting: operations.get("demote")?.isActive || false,
    handleReorder,
    finalizeDragReorder,
    promoteToActive,
    removeFromActive,
  };
};
