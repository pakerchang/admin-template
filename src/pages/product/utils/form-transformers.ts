import { produce } from "immer";

import { productTypeEnums } from "@/services/contracts/product";
import { activeStatusEnums } from "@/services/types/schema";

import type { TProductForm } from "@/pages/product/hooks/use-product";
import type { TProduct, EProductType } from "@/services/contracts/product";
import type { EActiveStatus } from "@/services/types/schema";

type LangField = { zh?: string; en?: string; th?: string } | undefined;

const DEFAULT_LANG_VALUES = { zh: "", en: "", th: "" };

export const ensureLangField = (langField: LangField) => ({
  zh: langField?.zh || "",
  en: langField?.en || "",
  th: langField?.th || "",
});

const validateProductType = (productType: string | undefined): EProductType => {
  if (!productType) return productTypeEnums.enum.NO_TYPE;

  return Object.values(productTypeEnums.enum).includes(
    productType as EProductType
  )
    ? (productType as EProductType)
    : productTypeEnums.enum.NO_TYPE;
};

const validateProductStatus = (
  productStatus: string | undefined
): EActiveStatus => {
  if (!productStatus) return activeStatusEnums.enum.inactive;

  return Object.values(activeStatusEnums.enum).includes(
    productStatus as EActiveStatus
  )
    ? (productStatus as EActiveStatus)
    : activeStatusEnums.enum.inactive;
};

export const transformFormDataForSubmission = (formData: TProductForm) => ({
  ...formData,
  product_name: formData.product_name || "",
  product_images: formData.product_images || [],
  product_price: formData.product_price.toString(),
  product_size: formData.product_size?.toString() || "0",
  product_detail: {
    ...formData.product_detail,
    product_description: ensureLangField(
      formData.product_detail?.product_description
    ),
    short_title: ensureLangField(formData.product_detail?.short_title),
    ingredients: ensureLangField(formData.product_detail?.ingredients),
    introduction: ensureLangField(formData.product_detail?.introduction),
    precautions: ensureLangField(formData.product_detail?.precautions),
    shelf_life: formData.product_detail?.shelf_life || "",
    origin: ensureLangField(formData.product_detail?.origin),
    aroma_level: formData.product_detail?.aroma_level || "",
    flavor: ensureLangField(formData.product_detail?.flavor),
    appearance: ensureLangField(formData.product_detail?.appearance),
    best_occasion: ensureLangField(formData.product_detail?.best_occasion),
    scene_matching: ensureLangField(formData.product_detail?.scene_matching),
    food_pairing: ensureLangField(formData.product_detail?.food_pairing),
  },
});

export const transformProductToFormData = (product: TProduct): TProductForm =>
  produce({} as TProductForm, (draft) => {
    draft.product_name = product.product_name || "";
    draft.product_price = parseInt(product.product_price || "10", 10);
    draft.product_size = parseInt(product.product_size || "15", 10);
    draft.product_images = product.product_images || [];
    draft.vendor_id = product.vendor_id || [];
    draft.tag_id = product.tag_id || [];

    draft.product_type = validateProductType(product.product_type);
    draft.product_status = validateProductStatus(product.product_status);

    draft.product_detail = {
      product_description:
        product.product_detail?.product_description || DEFAULT_LANG_VALUES,
      short_title: product.product_detail?.short_title || DEFAULT_LANG_VALUES,
      ingredients: product.product_detail?.ingredients || DEFAULT_LANG_VALUES,
      introduction: product.product_detail?.introduction || DEFAULT_LANG_VALUES,
      precautions: product.product_detail?.precautions || DEFAULT_LANG_VALUES,
      shelf_life: product.product_detail?.shelf_life || "",
      origin: product.product_detail?.origin || DEFAULT_LANG_VALUES,
      aroma_level: product.product_detail?.aroma_level || "",
      flavor: product.product_detail?.flavor || DEFAULT_LANG_VALUES,
      appearance: product.product_detail?.appearance || DEFAULT_LANG_VALUES,
      best_occasion:
        product.product_detail?.best_occasion || DEFAULT_LANG_VALUES,
      scene_matching:
        product.product_detail?.scene_matching || DEFAULT_LANG_VALUES,
      food_pairing: product.product_detail?.food_pairing || DEFAULT_LANG_VALUES,
    };
  });
