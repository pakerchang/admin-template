// AC2：getXQueryOptions 能直接餵 ensureQueryData（tsc --noEmit 驗證，不執行）
import { QueryClient } from "@tanstack/react-query";

import { getListBannersQueryKey, getListBannersQueryOptions, type listBannersResponse } from "../generated/api/banners/banners";
import { ListBannersResponse } from "../generated/zod/banners/banners.zod";

const queryClient = new QueryClient();

export const loader = async () => {
  const res: listBannersResponse = await queryClient.ensureQueryData(getListBannersQueryOptions({ page: 1, limit: 20 }));
  // fetch client 回 { data, status, headers }，信封在 res.data
  if (res.status === 200) {
    const total: number | undefined = res.data.total;
    return total;
  }
  return undefined;
};

export const key = getListBannersQueryKey({ page: 1 });
export const parsed = ListBannersResponse.safeParse({});
