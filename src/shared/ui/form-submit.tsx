import { useCan } from "@/shared/permission";
import { Button } from "@/shared/ui/button";

import type { TPermission } from "@/shared/permission";
import type { ComponentProps } from "react";

type TFormSubmitProps = ComponentProps<typeof Button> & {
  permission: TPermission;
  /** 無權限時的說明（hover title）；預設顯示所需 permission */
  deniedHint?: string;
};

/** §6.4：表單送出鈕。無權限 → disabled（預設 "disable"，不隱藏，讓使用者知道有這個動作） */
export const FormSubmit = ({
  permission,
  deniedHint,
  disabled,
  ...props
}: TFormSubmitProps) => {
  const allowed = useCan()(permission);
  return (
    <Button
      type="submit"
      {...props}
      disabled={!allowed || disabled}
      title={allowed ? props.title : (deniedHint ?? permission)}
    />
  );
};
