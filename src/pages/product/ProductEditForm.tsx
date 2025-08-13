import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useUnmount } from "react-use";

import ImageUploadDialog from "@/components/shared/dialog/ImageUploadDialog";
import { Navbar } from "@/components/shared/Navbar";
import Paper from "@/components/shared/Paper";
import { LangFormInput, TextInput } from "@/components/shared/TextInputs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useImgUpload } from "@/hooks/use-img-upload";
import { MultiSelectField } from "@/pages/product/components/MultiSelectField";
import ProductEditConfirmDialog from "@/pages/product/components/ProductEditConfirmDialog";
import {
  useGetProduct,
  useProductSchema,
  useUpdateProduct,
} from "@/pages/product/hooks/use-product";
import { getActualChanges } from "@/pages/product/utils/field-comparison";
import {
  transformFormDataForSubmission,
  transformProductToFormData,
} from "@/pages/product/utils/form-transformers";
import { useGetSupplierAll } from "@/pages/suppliers/hooks/use-supplier";
import { useGetAllTags } from "@/pages/tags/hooks/use-tag";
import { createGeneralImageValidationManager } from "@/plugins/image-validation";
import { productTypeEnums } from "@/services/contracts/product";
import { activeStatusEnums } from "@/services/types/schema";
import { arraysEqual } from "@/utils/array-helpers";

import type { TransKey } from "@/constants/locales";
import type { FieldChange } from "@/pages/product/components/ProductEditConfirmDialog";
import type { TProductForm } from "@/pages/product/hooks/use-product";
import type { EProductType } from "@/services/contracts/product";
import type { EActiveStatus } from "@/services/types/schema";

const DEFAULT_LANG_VALUES = { zh: "", en: "", th: "" };
const DEFAULT_VALUES: TProductForm = {
  product_name: "",
  product_type: productTypeEnums.enum.NO_TYPE,
  product_price: 10,
  product_images: [],
  product_status: activeStatusEnums.enum.inactive,
  product_size: 15,
  supplier_id: [],
  tag_id: [],
  product_detail: {
    product_description: DEFAULT_LANG_VALUES,
    short_title: DEFAULT_LANG_VALUES,
    ingredients: DEFAULT_LANG_VALUES,
    introduction: DEFAULT_LANG_VALUES,
    precautions: DEFAULT_LANG_VALUES,
    shelf_life: "",
    origin: DEFAULT_LANG_VALUES,
    aroma_level: "",
    flavor: DEFAULT_LANG_VALUES,
    appearance: DEFAULT_LANG_VALUES,
    best_occasion: DEFAULT_LANG_VALUES,
    scene_matching: DEFAULT_LANG_VALUES,
    food_pairing: DEFAULT_LANG_VALUES,
  },
} as const;

const ProductEditForm = () => {
  const { t } = useTranslation();
  const { id: productId } = useParams({ strict: false });

  const imageValidationManager = useMemo(() => {
    return createGeneralImageValidationManager();
  }, []);

  const productFormSchema = useProductSchema("edit");

  const { data: productData, isLoading: isLoadingProduct } = useGetProduct(
    productId || ""
  );

  const { mutate: updateProduct, isPending: isEditUpdating } =
    useUpdateProduct();
  const currentImages = useMemo(() => {
    if (!productData || isLoadingProduct) return [];
    const product = productData[0];
    return product?.product_images || [];
  }, [productData, isLoadingProduct]);

  const { upload, isUploading, uploadedImages, removeImage } =
    useImgUpload(currentImages);
  const { data: suppliersData, isLoading: suppliersLoading } =
    useGetSupplierAll();
  const { data: tagsData, isLoading: tagsLoading } = useGetAllTags();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<{
    currentData: TProductForm;
    changes: FieldChange[];
  } | null>(null);

  const data = useMemo((): TProductForm => {
    if (
      !productData ||
      !Array.isArray(productData) ||
      productData.length === 0 ||
      isLoadingProduct
    ) {
      return DEFAULT_VALUES;
    }

    const product = productData[0];
    return transformProductToFormData(product);
  }, [productData, isLoadingProduct]);

  const form = useForm<TProductForm>({
    resolver: zodResolver(productFormSchema),
    defaultValues: data,
    mode: "onBlur",
  });

  useEffect(() => {
    if (
      productData &&
      Array.isArray(productData) &&
      productData.length > 0 &&
      !isLoadingProduct
    ) {
      const product = productData[0];
      const formData = transformProductToFormData(product);

      const currentFormData = form.getValues();
      const hasChanged =
        currentFormData.product_name !== formData.product_name ||
        currentFormData.product_type !== formData.product_type ||
        currentFormData.product_status !== formData.product_status ||
        !arraysEqual(
          currentFormData.supplier_id || [],
          formData.supplier_id || []
        ) ||
        !arraysEqual(currentFormData.tag_id || [], formData.tag_id || []);

      if (hasChanged) {
        form.reset(formData);

        form.setValue("product_type", formData.product_type, {
          shouldValidate: true,
          shouldDirty: false,
        });
        form.setValue("product_status", formData.product_status, {
          shouldValidate: true,
          shouldDirty: false,
        });
        form.setValue("supplier_id", formData.supplier_id || [], {
          shouldValidate: true,
          shouldDirty: false,
        });
        form.setValue("tag_id", formData.tag_id || [], {
          shouldValidate: true,
          shouldDirty: false,
        });

        form.setValue("product_images", formData.product_images || [], {
          shouldDirty: false,
        });
      }
    }
  }, [form, productData, isLoadingProduct]);

  useEffect(() => {
    const currentFormImages = form.getValues("product_images");
    if (JSON.stringify(currentFormImages) !== JSON.stringify(uploadedImages)) {
      const isUserAction = uploadedImages.length !== currentImages.length;
      form.setValue("product_images", uploadedImages, {
        shouldDirty: isUserAction,
      });
    }
  }, [form, uploadedImages, currentImages]);

  useUnmount(() => {
    form.reset(DEFAULT_VALUES);
  });

  const handleDirectSubmission = (data: TProductForm) => {
    if (!productId) return;

    const submissionData = transformFormDataForSubmission(data);
    updateProduct({
      ...submissionData,
      product_id: productId,
    });
  };

  const onSubmit = (data: TProductForm) => {
    if (!productId) return;

    if (!form.formState.isDirty) {
      handleDirectSubmission(data);
      return;
    }

    const originalProductData = productData?.[0];
    if (!originalProductData) return;

    const originalData = transformProductToFormData(originalProductData);
    const changes = getActualChanges(form, originalData, {
      suppliers: suppliersData?.data,
      tags: tagsData?.data,
    });

    if (changes.length === 0) {
      handleDirectSubmission(data);
      return;
    }
    setPendingSubmission({ currentData: data, changes });
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmission = () => {
    if (pendingSubmission) {
      handleDirectSubmission(pendingSubmission.currentData);
      setShowConfirmDialog(false);
      setPendingSubmission(null);
    }
  };

  const handleCancelSubmission = () => {
    setShowConfirmDialog(false);
    setPendingSubmission(null);
  };

  const isSubmitDisabled =
    isEditUpdating || !form.formState.isDirty || !form.formState.isValid;

  if (isLoadingProduct)
    return (
      <div className="flex size-full items-center justify-center">
        <Spinner />
      </div>
    );

  const navbarActions = (
    <div className="flex w-full items-center justify-end">
      <Button
        type="submit"
        form="product-edit-form"
        className="h-10 w-fit"
        disabled={isSubmitDisabled}
      >
        {isEditUpdating
          ? t("pages.product.productCreate.submitting")
          : t("common.submit")}
      </Button>
    </div>
  );

  return (
    <main className="flex size-full flex-col">
      <Navbar>{navbarActions}</Navbar>
      <form
        id="product-edit-form"
        className="flex size-full flex-col gap-4 p-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <Paper className="flex w-full flex-col gap-4">
          <h3 className="text-3xl font-bold">
            {t("pages.product.productCreate.title")}
          </h3>
          <TextInput
            className="flex-1"
            label={t("pages.product.productCreate.productName")}
            {...form.register("product_name")}
            error={form.formState.errors.product_name}
          />
          <TextInput
            className="flex-1"
            label={t("pages.product.productCreate.price")}
            type="number"
            {...form.register("product_price", {
              valueAsNumber: true,
            })}
            error={form.formState.errors.product_price}
          />
          <TextInput
            className="flex-1"
            label={t("pages.product.productCreate.productSize")}
            type="number"
            {...form.register("product_size", {
              valueAsNumber: true,
            })}
            error={form.formState.errors.product_size}
          />
          <Label className="text-sm font-medium">
            {t("pages.product.productCreate.productType")}
          </Label>
          <Select
            value={form.watch("product_type") || productTypeEnums.enum.NO_TYPE}
            disabled={isLoadingProduct}
            onValueChange={(value: EProductType) => {
              const validValue = Object.values(productTypeEnums.enum).includes(
                value
              )
                ? value
                : productTypeEnums.enum.NO_TYPE;

              form.setValue("product_type", validValue, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              });
            }}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={t(
                  "pages.product.productCreate.productTypePlaceholder"
                )}
              />
            </SelectTrigger>
            <SelectContent>
              {Object.values(productTypeEnums.enum).map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`pages.product.productTypes.${type}` as TransKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.product_type && (
            <p className="text-sm text-destructive">
              {form.formState.errors.product_type.message}
            </p>
          )}
          <MultiSelectField
            fieldName="vendor_id"
            form={form}
            label={t("pages.product.productCreate.supplier")}
            placeholder={t("pages.product.productCreate.supplierPlaceholder")}
            options={
              suppliersData?.data?.map((supplier) => ({
                value: supplier.supplier_id,
                label: supplier.supplier_name,
              })) || []
            }
            isLoading={suppliersLoading}
          />

          <MultiSelectField
            fieldName="tag_id"
            form={form}
            label={t("pages.product.productCreate.tags")}
            placeholder={t("pages.product.productCreate.selectTag")}
            options={
              tagsData?.data?.map((tag) => ({
                value: tag.tag_id,
                label: tag.tag_name,
              })) || []
            }
            isLoading={tagsLoading}
          />

          <Label className="text-sm font-medium">
            {t("pages.product.productCreate.productStatus")}
          </Label>
          <Select
            value={
              form.watch("product_status") || activeStatusEnums.enum.inactive
            }
            disabled={isLoadingProduct}
            onValueChange={(value: EActiveStatus) => {
              const validValue = Object.values(activeStatusEnums.enum).includes(
                value
              )
                ? value
                : activeStatusEnums.enum.inactive;

              form.setValue("product_status", validValue, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              });
            }}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={t(
                  "pages.product.productCreate.productStatusPlaceholder"
                )}
              />
            </SelectTrigger>
            <SelectContent>
              {Object.values(activeStatusEnums.enum).map((status) => {
                return (
                  <SelectItem key={status} value={status}>
                    {t(`pages.product.productCreate.${status}`)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {form.formState.errors.product_status && (
            <p className="text-sm text-destructive">
              {form.formState.errors.product_status.message}
            </p>
          )}
        </Paper>

        <Paper className="flex w-full flex-col gap-4">
          <h3 className="text-3xl font-bold">
            {t("pages.product.productCreate.productImages")}
          </h3>
          <div className="flex flex-wrap gap-4">
            {isUploading && (
              <span>{t("validation.editor.image.uploading")}</span>
            )}
            {(form.watch("product_images") || []).map((image, index) => (
              <div
                key={index}
                className="group relative flex size-24 items-center justify-center overflow-hidden rounded-md"
              >
                <img
                  src={image.file_url}
                  alt={`Product ${index + 1}`}
                  className="size-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-red-500"
                    onClick={() => removeImage(image.file_name)}
                  >
                    <Trash2 className="size-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <ImageUploadDialog
            onUpload={upload}
            error={!!form.formState.errors.product_images}
            validationManager={imageValidationManager}
          />
          {form.formState.errors.product_images && (
            <p className="text-sm text-destructive">
              {form.formState.errors.product_images.message}
            </p>
          )}
        </Paper>

        <div className="flex w-full gap-4">
          <Paper className="flex flex-1 gap-4">
            <LangFormInput
              className="flex-1"
              label={t("pages.product.productCreate.shortTitle")}
              zh={form.register("product_detail.short_title.zh")}
              en={form.register("product_detail.short_title.en")}
              th={form.register("product_detail.short_title.th")}
              error={
                form.formState.errors.product_detail?.short_title?.zh ||
                form.formState.errors.product_detail?.short_title?.en ||
                form.formState.errors.product_detail?.short_title?.th
              }
            />
          </Paper>
        </div>

        <div className="flex w-full gap-4">
          <Paper className="flex flex-1 gap-4">
            <LangFormInput
              className="flex-1"
              label={t("pages.product.productCreate.introduction")}
              zh={form.register("product_detail.introduction.zh")}
              en={form.register("product_detail.introduction.en")}
              th={form.register("product_detail.introduction.th")}
              error={
                form.formState.errors.product_detail?.introduction?.zh ||
                form.formState.errors.product_detail?.introduction?.en ||
                form.formState.errors.product_detail?.introduction?.th
              }
            />
          </Paper>
          <Paper className="flex flex-1 gap-4">
            <LangFormInput
              className="flex-1"
              label={t("pages.product.productCreate.productDescription")}
              zh={form.register("product_detail.product_description.zh")}
              en={form.register("product_detail.product_description.en")}
              th={form.register("product_detail.product_description.th")}
              error={
                form.formState.errors.product_detail?.product_description?.zh ||
                form.formState.errors.product_detail?.product_description?.en ||
                form.formState.errors.product_detail?.product_description?.th
              }
            />
          </Paper>
        </div>

        <div className="flex w-full gap-4">
          <Paper className="flex flex-1 gap-4">
            <LangFormInput
              className="flex-1"
              label={t("pages.product.productCreate.ingredients")}
              zh={form.register("product_detail.ingredients.zh")}
              en={form.register("product_detail.ingredients.en")}
              th={form.register("product_detail.ingredients.th")}
              error={
                form.formState.errors.product_detail?.ingredients?.zh ||
                form.formState.errors.product_detail?.ingredients?.en ||
                form.formState.errors.product_detail?.ingredients?.th
              }
            />
          </Paper>
          <Paper className="flex flex-1 gap-4">
            <LangFormInput
              className="flex-1"
              label={t("pages.product.productCreate.precautions")}
              zh={form.register("product_detail.precautions.zh")}
              en={form.register("product_detail.precautions.en")}
              th={form.register("product_detail.precautions.th")}
              error={
                form.formState.errors.product_detail?.precautions?.zh ||
                form.formState.errors.product_detail?.precautions?.en ||
                form.formState.errors.product_detail?.precautions?.th
              }
            />
          </Paper>
        </div>

        <div className="flex w-full gap-4">
          <Paper className="flex flex-1 gap-4">
            <LangFormInput
              className="flex-1"
              label={t("pages.product.productCreate.origin")}
              zh={form.register("product_detail.origin.zh")}
              en={form.register("product_detail.origin.en")}
              th={form.register("product_detail.origin.th")}
              error={
                form.formState.errors.product_detail?.origin?.zh ||
                form.formState.errors.product_detail?.origin?.en ||
                form.formState.errors.product_detail?.origin?.th
              }
            />
          </Paper>
          <Paper className="flex flex-1 gap-4">
            <LangFormInput
              className="flex-1"
              label={t("pages.product.productCreate.appearance")}
              zh={form.register("product_detail.appearance.zh")}
              en={form.register("product_detail.appearance.en")}
              th={form.register("product_detail.appearance.th")}
              error={
                form.formState.errors.product_detail?.appearance?.zh ||
                form.formState.errors.product_detail?.appearance?.en ||
                form.formState.errors.product_detail?.appearance?.th
              }
            />
          </Paper>
        </div>

        <div className="flex w-full gap-4">
          <Paper className="flex flex-1 gap-4">
            <LangFormInput
              className="flex-1"
              label={t("pages.product.productCreate.foodPairing")}
              zh={form.register("product_detail.food_pairing.zh")}
              en={form.register("product_detail.food_pairing.en")}
              th={form.register("product_detail.food_pairing.th")}
              error={
                form.formState.errors.product_detail?.food_pairing?.zh ||
                form.formState.errors.product_detail?.food_pairing?.en ||
                form.formState.errors.product_detail?.food_pairing?.th
              }
            />
          </Paper>
          <Paper className="flex flex-1 gap-4">
            <LangFormInput
              className="flex-1"
              label={t("pages.product.productCreate.flavor")}
              zh={form.register("product_detail.flavor.zh")}
              en={form.register("product_detail.flavor.en")}
              th={form.register("product_detail.flavor.th")}
              error={
                form.formState.errors.product_detail?.flavor?.zh ||
                form.formState.errors.product_detail?.flavor?.en ||
                form.formState.errors.product_detail?.flavor?.th
              }
            />
          </Paper>
        </div>

        <div className="flex w-full gap-4">
          <Paper className="flex flex-1 gap-4">
            <LangFormInput
              className="flex-1"
              label={t("pages.product.productCreate.bestOccasion")}
              zh={form.register("product_detail.best_occasion.zh")}
              en={form.register("product_detail.best_occasion.en")}
              th={form.register("product_detail.best_occasion.th")}
              error={
                form.formState.errors.product_detail?.best_occasion?.zh ||
                form.formState.errors.product_detail?.best_occasion?.en ||
                form.formState.errors.product_detail?.best_occasion?.th
              }
            />
          </Paper>
          <Paper className="flex flex-1 gap-4">
            <LangFormInput
              className="flex-1"
              label={t("pages.product.productCreate.sceneMatching")}
              zh={form.register("product_detail.scene_matching.zh")}
              en={form.register("product_detail.scene_matching.en")}
              th={form.register("product_detail.scene_matching.th")}
              error={
                form.formState.errors.product_detail?.scene_matching?.zh ||
                form.formState.errors.product_detail?.scene_matching?.en ||
                form.formState.errors.product_detail?.scene_matching?.th
              }
            />
          </Paper>
        </div>

        <Paper className="flex w-full gap-4">
          <TextInput
            className="flex-1"
            label={t("pages.product.productCreate.shelfLife")}
            {...form.register("product_detail.shelf_life")}
            error={form.formState.errors.product_detail?.shelf_life}
          />
          <TextInput
            className="flex-1"
            label={t("pages.product.productCreate.aromaLevel")}
            {...form.register("product_detail.aroma_level")}
            error={form.formState.errors.product_detail?.aroma_level}
          />
        </Paper>
      </form>

      <ProductEditConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        changes={pendingSubmission?.changes || []}
        onConfirm={handleConfirmSubmission}
        onCancel={handleCancelSubmission}
        isSubmitting={isEditUpdating}
      />
    </main>
  );
};

export default ProductEditForm;
