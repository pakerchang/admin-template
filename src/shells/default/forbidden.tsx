import { UnauthorizedPage } from "@/components/shared/UnauthorizedPage";

/** R10：內容區 403（填滿 protected layout 的 <Outlet /> 區域，不蓋掉 sidebar） */
export const Forbidden = () => <UnauthorizedPage />;
