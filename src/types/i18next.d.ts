import "i18next";
import type { TransKey } from "@/constants/locales";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    keySeparator: ".";
    returnNull: false;
    returnType: string;
  }

  interface TFunction {
    (key: TransKey): string;
    (key: TransKey, options?: any): string;
  }
}
