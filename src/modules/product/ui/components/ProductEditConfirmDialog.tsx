import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

import type { FieldChange } from "../../model/field-comparison";
import type { TLeafKey } from "@/shared/i18n/types";

interface ProductEditConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changes: FieldChange[];
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const ProductEditConfirmDialog = ({
  open,
  onOpenChange,
  changes,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: ProductEditConfirmDialogProps) => {
  const { t } = useTranslation();

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const formatValue = (value: string | null, fieldName: string): string => {
    if (value === null || value === undefined || value === "") {
      return t("product.productEditConfirm.emptyValue");
    }

    const field = fieldName.split(".")[0];
    if (field === "product_type") {
      const typeKey = `product.productTypes.${value}`;
      const translated = t(typeKey as TLeafKey);
      return translated !== typeKey ? translated : value;
    }

    if (field === "product_status") {
      const statusKey = `product.productCreate.${value}`;
      const translated = t(statusKey as TLeafKey);
      return translated !== statusKey ? translated : value;
    }

    return value;
  };

  const formatFieldName = (change: FieldChange): string => {
    let fieldKey = change.fieldName;
    if (fieldKey.startsWith("product_detail.")) {
      fieldKey = fieldKey.replace("product_detail.", "").split(".")[0];
    }

    const camelCaseKey = fieldKey.replace(/_([a-z])/g, (_, letter) =>
      letter.toUpperCase()
    );

    let createFieldKey = `product.productCreate.${camelCaseKey}`;
    let fieldName = t(createFieldKey as TLeafKey);

    if (fieldName === createFieldKey) {
      createFieldKey = `product.productCreate.${fieldKey}`;
      fieldName = t(createFieldKey as TLeafKey);
    }

    if (fieldName === createFieldKey) {
      const tableFieldKey = `tables.product.${fieldKey}`;
      fieldName = t(tableFieldKey as TLeafKey);

      if (fieldName === tableFieldKey) {
        fieldName = fieldKey
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
      }
    }

    return fieldName;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("product.productEditConfirm.title")}</DialogTitle>
          <DialogDescription>
            {t("product.productEditConfirm.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {changes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("product.productEditConfirm.noChanges")}
            </p>
          ) : (
            <div className="space-y-4">
              <h4 className="text-sm font-medium">
                {t("product.productEditConfirm.changesList")}:
              </h4>
              <div className="space-y-3">
                {changes.map((change, index) => (
                  <div
                    key={index}
                    className="rounded-lg border bg-muted/20 p-3"
                  >
                    <div className="mb-2 text-sm font-medium">
                      {formatFieldName(change)}
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="min-w-[40px] text-muted-foreground">
                          {t("product.productEditConfirm.original")}:
                        </span>
                        <span className="break-all text-red-400/90">
                          {formatValue(change.originalValue, change.fieldName)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="min-w-[40px] text-muted-foreground">
                          {t("product.productEditConfirm.new")}:
                        </span>
                        <span className="break-all text-green-400/90">
                          {formatValue(change.newValue, change.fieldName)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || changes.length === 0}
          >
            {t("product.productEditConfirm.confirmSubmit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductEditConfirmDialog;
