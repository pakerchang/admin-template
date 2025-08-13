import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useMatchRoute, useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import * as R from "ramda";
import { useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useUnmount } from "react-use";

import ImageUploadDialog from "@/components/shared/dialog/ImageUploadDialog";
import { Navbar } from "@/components/shared/Navbar";
import Paper from "@/components/shared/Paper";
import { TextInput } from "@/components/shared/TextInputs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useImgUpload } from "@/hooks/use-img-upload";
import { useToast } from "@/hooks/use-toast";
import {
  createDesktopBannerValidationManager,
  createMobileBannerValidationManager,
} from "@/plugins/image-validation";
import { activeStatusEnums } from "@/services/types/schema";

import {
  useCreateBanner,
  useCreateBannerSchema,
  useGetBanner,
  useUpdateBanner,
} from "./hooks/use-banner";

import type { TBannerForm } from "./hooks/use-banner";

const DEFAULT_VALUES: TBannerForm = {
  title: "",
  redirect_url: "",
  banner_status: activeStatusEnums.enum.inactive,
  desktop_image_url: "",
  mobile_image_url: "",
  sort_order: 9,
};

const BannerForm = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();
  const routeParams = useParams({ strict: false });

  const desktopValidationManager = useMemo(
    () => createDesktopBannerValidationManager(),
    []
  );

  const mobileValidationManager = useMemo(
    () => createMobileBannerValidationManager(),
    []
  );

  const isEditMode = useMemo(() => {
    return matchRoute({
      to: "/banners/edit/$id",
      fuzzy: true,
    });
  }, [matchRoute]);

  const bannerId = useMemo(() => {
    return routeParams?.id || "";
  }, [routeParams?.id]);

  const { data: bannerData, isLoading: isLoadingBanner } = useGetBanner(
    isEditMode ? bannerId : ""
  );

  const { mutate: createBanner, isPending: isCreateUploading } =
    useCreateBanner();
  const { mutate: updateBanner, isPending: isEditUpdating } = useUpdateBanner();
  const { upload, removeImage, isUploading, uploadedImages } = useImgUpload();
  const bannerFormSchema = useCreateBannerSchema();

  const data = useMemo((): TBannerForm => {
    if (!isEditMode || !bannerData) return DEFAULT_VALUES;

    const firstBanner = Array.isArray(bannerData)
      ? R.head(bannerData)
      : bannerData;

    if (!firstBanner) return DEFAULT_VALUES;

    return {
      title: firstBanner.title,
      redirect_url: firstBanner.redirect_url,
      banner_status: firstBanner.banner_status,
      desktop_image_url:
        typeof firstBanner.desktop_image_url === "object"
          ? firstBanner.desktop_image_url.file_url
          : firstBanner.desktop_image_url,
      mobile_image_url:
        typeof firstBanner.mobile_image_url === "object"
          ? firstBanner.mobile_image_url.file_url
          : firstBanner.mobile_image_url,
      sort_order: firstBanner.sort_order,
    };
  }, [isEditMode, bannerData]);

  const form = useForm<TBannerForm>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onChange",
  });

  useEffect(() => {
    if (isEditMode && data !== DEFAULT_VALUES) {
      form.reset(data);
    }
  }, [form, isEditMode, data]);

  useUnmount(() => {
    if (isEditMode) {
      form.reset(DEFAULT_VALUES);
    } else {
      form.reset(data);
    }
  });

  const desktopImage = useMemo(() => {
    return uploadedImages.find((img) => img.file_name.startsWith("d_"));
  }, [uploadedImages]);

  const mobileImage = useMemo(() => {
    return uploadedImages.find((img) => img.file_name.startsWith("m_"));
  }, [uploadedImages]);

  useEffect(() => {
    if (desktopImage) {
      form.setValue("desktop_image_url", desktopImage.file_url, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  }, [desktopImage, form]);

  useEffect(() => {
    if (mobileImage) {
      form.setValue("mobile_image_url", mobileImage.file_url, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  }, [mobileImage, form]);

  const handleImageUpload = useCallback(
    (type: "desktop" | "mobile") =>
      async (fileName: string, base64: string) => {
        const existingImage = type === "desktop" ? desktopImage : mobileImage;
        if (existingImage) {
          removeImage(existingImage.file_name);
        }

        const prefix = type === "desktop" ? "d_" : "m_";
        const finalFileName = fileName.startsWith(prefix)
          ? fileName
          : `${prefix}${fileName}`;
        upload(finalFileName, base64);
      },
    [desktopImage, mobileImage, removeImage, upload]
  );

  const handleImageDelete = useCallback(
    (type: "desktop" | "mobile") => () => {
      const targetImage = type === "desktop" ? desktopImage : mobileImage;

      if (targetImage) {
        removeImage(targetImage.file_name);
      }

      form.setValue(
        type === "desktop" ? "desktop_image_url" : "mobile_image_url",
        "",
        {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        }
      );
    },
    [desktopImage, mobileImage, removeImage, form]
  );

  const onSubmit = useMemo(() => {
    return form.handleSubmit((data) => {
      const getImageFromUploaded = (type: "desktop" | "mobile") => {
        const targetImage = type === "desktop" ? desktopImage : mobileImage;

        if (targetImage) {
          return {
            file_name: targetImage.file_name,
            file_url: targetImage.file_url,
          };
        }

        const currentUrl =
          type === "desktop" ? data.desktop_image_url : data.mobile_image_url;
        if (currentUrl) {
          const fileName = currentUrl.split("/").pop() || "";
          const prefix = type === "desktop" ? "d_" : "m_";
          const prefixedFileName = fileName.startsWith(prefix)
            ? fileName
            : `${prefix}${fileName}`;

          return {
            file_name: prefixedFileName,
            file_url: currentUrl,
          };
        }

        return { file_name: "", file_url: "" };
      };

      const bannerData = {
        title: data.title,
        redirect_url: data.redirect_url,
        banner_status: data.banner_status,
        desktop_image_url: getImageFromUploaded("desktop"),
        mobile_image_url: getImageFromUploaded("mobile"),
        sort_order: 9,
      };

      if (!isEditMode) {
        createBanner(bannerData);
      } else {
        updateBanner(
          {
            ...bannerData,
            banner_id: bannerId,
            sort_order: data.sort_order ?? 9,
          },
          {
            onSuccess: () => {
              toast({
                title: t("common.success"),
                description: t("toast.banner.update.success"),
                variant: "success",
              });
              navigate({
                to: "/banners",
              });
            },
            onError: (error) => {
              toast({
                title: t("common.error"),
                description: error.message || t("toast.banner.update.error"),
                variant: "destructive",
              });
            },
          }
        );
      }
    });
  }, [
    form,
    desktopImage,
    mobileImage,
    isEditMode,
    updateBanner,
    bannerId,
    createBanner,
    toast,
    t,
    navigate,
  ]);

  const desktopFormValue = form.watch("desktop_image_url");
  const mobileFormValue = form.watch("mobile_image_url");

  const isCreateModeDisabled = useMemo(() => {
    if (!isEditMode) {
      const hasDesktopImage = !!desktopImage || !!desktopFormValue;
      const hasMobileImage = !!mobileImage || !!mobileFormValue;
      const hasRequiredImages = hasDesktopImage && hasMobileImage;

      return (
        isCreateUploading ||
        !form.formState.isValid ||
        !hasRequiredImages ||
        Object.keys(form.formState.errors).length > 0
      );
    }
    return false;
  }, [
    isEditMode,
    desktopImage,
    mobileImage,
    desktopFormValue,
    mobileFormValue,
    isCreateUploading,
    form.formState.isValid,
    form.formState.errors,
  ]);

  const isEditModeDisabled = useMemo(() => {
    if (isEditMode) {
      return isEditUpdating;
    }
    return false;
  }, [isEditMode, isEditUpdating]);

  const isSubmitDisabled =
    isCreateModeDisabled || isEditModeDisabled || isUploading;

  if (isLoadingBanner)
    return (
      <div className="flex size-full items-center justify-center">
        <Spinner />
      </div>
    );

  return (
    <main className="flex size-full flex-col">
      <Navbar>
        <Button
          type="submit"
          form="banner-form"
          className="h-10 w-fit"
          disabled={isSubmitDisabled}
        >
          {isCreateUploading || isEditUpdating
            ? t("pages.banner.bannerCreate.submitting")
            : t("common.submit")}
        </Button>
      </Navbar>
      <form
        id="banner-form"
        className="flex size-full flex-col gap-4 p-4"
        onSubmit={onSubmit}
      >
        <Paper className="flex w-full flex-col gap-4">
          <h3 className="text-3xl font-bold">
            {t("pages.banner.bannerCreate.title")}
          </h3>

          <TextInput
            className="flex-1"
            label={t("pages.banner.bannerCreate.title")}
            error={form.formState.errors.title}
            {...form.register("title")}
          />

          <TextInput
            className="flex-1"
            label={t("pages.banner.bannerCreate.redirectUrl")}
            error={form.formState.errors.redirect_url}
            type="url"
            {...form.register("redirect_url")}
          />
        </Paper>

        <Paper className="flex w-full flex-col gap-4">
          <h3 className="text-3xl font-bold">
            {t("pages.banner.bannerCreate.images")}
          </h3>

          <div className="flex grow items-center gap-4">
            <div className="flex flex-col gap-3">
              <Label className="text-sm font-medium">
                {t("pages.banner.bannerCreate.desktopImage")}
              </Label>
              {form.formState.errors.desktop_image_url?.message && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.desktop_image_url?.message}
                </p>
              )}
              <div className="flex flex-1 flex-wrap gap-4">
                <div className="group relative flex h-[300px] w-fit min-w-[300px] items-center justify-center overflow-hidden rounded-md border">
                  {desktopImage || desktopFormValue ? (
                    <>
                      <img
                        src={desktopImage?.file_url || desktopFormValue}
                        alt="Desktop Banner"
                        className="size-full object-contain"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="destructive"
                          size="icon"
                          type="button"
                          onClick={handleImageDelete("desktop")}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <ImageUploadDialog
                      onUpload={handleImageUpload("desktop")}
                      error={!!form.formState.errors.desktop_image_url}
                      validationManager={desktopValidationManager}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Label className="text-sm font-medium">
                {t("pages.banner.bannerCreate.mobileImage")}
              </Label>
              {form.formState.errors.mobile_image_url?.message && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.mobile_image_url?.message}
                </p>
              )}
              <div className="flex flex-wrap gap-4">
                <div className="group relative flex h-[300px] w-fit min-w-[300px] items-center justify-center overflow-hidden rounded-md border">
                  {mobileImage || mobileFormValue ? (
                    <>
                      <img
                        src={mobileImage?.file_url || mobileFormValue}
                        alt="Mobile Banner"
                        className="size-full object-contain"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="destructive"
                          size="icon"
                          type="button"
                          onClick={handleImageDelete("mobile")}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <ImageUploadDialog
                      onUpload={handleImageUpload("mobile")}
                      error={!!form.formState.errors.mobile_image_url}
                      validationManager={mobileValidationManager}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </Paper>
      </form>
    </main>
  );
};

export default BannerForm;
