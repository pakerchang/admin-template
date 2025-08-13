import { useNavigate } from "@tanstack/react-router";
import { Plus, LayoutGrid, LayoutList, ArrowUpDown, Copy } from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { numericFormatter } from "react-number-format";

import Card from "@/components/shared/Card";
import DataTable from "@/components/shared/DataTable";
import EditActions from "@/components/shared/EditActions";
import { Navbar } from "@/components/shared/Navbar";
import {
  TABLE_VISIBILITY_STORAGE_KEYS,
  useApiSorting,
  convertToApiSorting,
} from "@/components/shared/table";
import { Button } from "@/components/ui/button";
import { paginationSchema, activeStatusEnums } from "@/services/types";

import StatusColumnFilter from "./components/StatusColumnFilter";
import {
  useDeleteProduct,
  useGetProductList,
  useGetAllProducts,
} from "./hooks/use-product";

import type { TransKey } from "@/constants/locales";
import type { TransTypes } from "@/locales/types";
import type { TProduct } from "@/services/contracts/product";
import type {
  ColumnDef,
  PaginationState,
  ColumnFiltersState,
} from "@tanstack/react-table";

const ProductPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: paginationSchema.parse({}).limit,
  });

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const { sorting, setSorting } = useApiSorting({
    onSortChange: useCallback(() => {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, []),
  });

  const handleColumnFiltersChange = useCallback(
    (
      updaterOrValue:
        | ColumnFiltersState
        | ((old: ColumnFiltersState) => ColumnFiltersState)
    ) => {
      setColumnFilters(updaterOrValue);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    []
  );

  const statusFilter = useMemo(() => {
    const statusFilterItem = columnFilters.find(
      (filter) => filter.id === "product_status"
    );

    if (!statusFilterItem?.value) return undefined;

    const parseResult = activeStatusEnums.safeParse(statusFilterItem.value);
    return parseResult.success ? parseResult.data : undefined;
  }, [columnFilters]);

  const apiSortingParams = convertToApiSorting(sorting);

  const {
    data: productList,
    isLoading,
    isLoadingError,
  } = useGetProductList({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    ...apiSortingParams,
    ...(statusFilter && { product_status: statusFilter }),
  });

  const { data: allProducts } = useGetAllProducts();

  const statusCounts = useMemo(() => {
    if (!allProducts?.data) {
      return { total: 0, active: 0, inactive: 0 };
    }

    const products = allProducts.data;
    return {
      total: products.length,
      active: products.filter((p) => p.product_status === "active").length,
      inactive: products.filter((p) => p.product_status === "inactive").length,
    };
  }, [allProducts]);

  const { mutate: deleteProduct } = useDeleteProduct();

  const [toggleLayout, setToggleLayout] = useState(false);
  const lng = i18n.language as TransTypes;

  const onToggleLayout = () => {
    setToggleLayout(!toggleLayout);
  };

  const onDeleteProduct = (id: string) => {
    deleteProduct(id);
  };

  const columns: ColumnDef<TProduct>[] = [
    {
      id: "thumbnail",
      enableHiding: true,
      meta: {
        displayName: t("table.headers.product.thumbnail"),
      },
      header: () => (
        <h4 className="text-center ">{t("table.headers.product.thumbnail")}</h4>
      ),
      cell: ({ row }) => {
        const images = row.original.product_images;
        const thumbnail = images?.find((image) => image.file_url.length !== 0);

        const imgSrc = !!thumbnail
          ? thumbnail.file_url
          : "https://fakeimg.pl/40x40";
        return (
          <div className="flex w-full items-center justify-center rounded-md">
            <img src={imgSrc} alt="thumbnail" width={40} height={40} />
          </div>
        );
      },
    },
    {
      accessorKey: "product_type",
      id: "product_type",
      enableHiding: true,
      meta: {
        displayName: t("table.headers.product.productType"),
      },
      header: () => (
        <h4 className="text-center ">
          {t("table.headers.product.productType")}
        </h4>
      ),
      cell: ({ row }) => {
        const productType = row.getValue("product_type") as string;
        const displayText = productType
          ? t(
              `pages.product.productTypes.${productType}` as TransKey
            ).toString()
          : "-";

        return <p className="text-center">{displayText}</p>;
      },
    },
    {
      accessorKey: "product_name",
      id: "product_name",
      enableHiding: true,
      meta: {
        displayName: t("table.headers.product.productName"),
      },
      header: () => (
        <h4 className="text-center ">
          {t("table.headers.product.productName")}
        </h4>
      ),
      cell: ({ row }) => {
        return (
          <p className="text-center">{row.getValue("product_name") ?? "-"}</p>
        );
      },
    },
    {
      accessorKey: "product_id",
      enableHiding: true,
      enableSorting: true,
      meta: {
        displayName: t("table.headers.product.productCode"),
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-center "
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("table.headers.product.productCode")}
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <p className="text-center">{row.getValue("product_id")}</p>
      ),
    },
    {
      accessorKey: "product_size",
      id: "product_size",
      enableHiding: true,
      enableSorting: true,
      meta: {
        displayName: t("table.headers.product.productStock"),
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("table.headers.product.productStock")}
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <p className="text-center">{row.getValue("product_size")}</p>
      ),
    },
    {
      accessorKey: "product_price",
      enableHiding: true,
      enableSorting: true,
      meta: {
        displayName: t("table.headers.product.price"),
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-center "
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("table.headers.product.price")}
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <p className="text-center font-medium">
          {numericFormatter(row.getValue("product_price"), {
            thousandSeparator: ",",
            decimalSeparator: ".",
            decimalScale: 2,
          })}
        </p>
      ),
    },
    {
      accessorKey: "product_status",
      id: "product_status",
      enableHiding: true,
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        displayName: t("table.headers.product.productStatus"),
      },
      header: ({ column }) => (
        <StatusColumnFilter column={column} statusCounts={statusCounts} />
      ),
      cell: ({ row }) => {
        const status = row.getValue<string>("product_status");
        const displayText = status
          ? t(`pages.product.status.${status}` as TransKey).toString()
          : "-";
        return <p className="text-center">{displayText}</p>;
      },
    },
    {
      id: "actions",
      enableHiding: true,
      meta: {
        displayName: t("table.headers.product.actions"),
      },
      header: () => (
        <h4 className="text-center ">{t("table.headers.product.actions")}</h4>
      ),
      cell: ({ row }) => {
        const id = row.original.product_id;
        return (
          <EditActions
            onEdit={() =>
              navigate({
                to: "/products/edit/$id",
                params: { id },
              })
            }
            onDelete={() => onDeleteProduct(id)}
          >
            <Button
              variant="outline"
              title={t("pages.product.productDraft.copyToCreate")}
              aria-label={t("pages.product.productDraft.copyToCreate")}
              onClick={() =>
                navigate({
                  to: "/products/draft/$id",
                  params: { id },
                })
              }
            >
              <Copy size={16} />
            </Button>
          </EditActions>
        );
      },
    },
  ];

  return (
    <div className="flex size-full flex-col gap-4">
      <Navbar>
        <div className="flex w-full items-center justify-end gap-x-4">
          <Button variant="outline" onClick={onToggleLayout}>
            {toggleLayout ? <LayoutList /> : <LayoutGrid />}
          </Button>

          <Button
            onClick={() => {
              try {
                navigate({ to: "/products/create" });
              } catch (error) {
                console.error("Navigation error:", error);
              }
            }}
          >
            <Plus className="size-4" />
            {t("pages.product.productCreate.addProduct")}
          </Button>
        </div>
      </Navbar>

      {!isLoading || !isLoadingError ? (
        toggleLayout ? (
          <div className="grid w-full grid-cols-[repeat(auto-fill,350px)] gap-6 p-4">
            {productList?.data?.map((prd, idx) => {
              if (!prd || !prd.product_detail) return null;
              const productName = prd.product_name ?? "";
              const productDesc =
                prd.product_detail.product_description?.[lng] ?? "";
              const productImage = prd.product_images?.[0]?.file_url;
              const productStatus = prd.product_status ?? "-";
              const productStock = prd.product_size ?? "0";
              const productPrice = prd.product_price ?? "0";

              return (
                <Card
                  key={idx}
                  className="h-[550px] w-[350px]"
                  title={productName}
                  desc={productDesc}
                  imgSrc={productImage}
                  status={productStatus}
                  stock={productStock}
                  price={productPrice}
                  footer={
                    <EditActions
                      className="w-full justify-end"
                      onEdit={() =>
                        navigate({
                          to: "/products/edit/$id",
                          params: { id: prd.product_id },
                        })
                      }
                      onDelete={() => onDeleteProduct(prd.product_id)}
                    >
                      <Button
                        variant="outline"
                        title={t("pages.product.productDraft.copyToCreate")}
                        aria-label={t(
                          "pages.product.productDraft.copyToCreate"
                        )}
                        onClick={() =>
                          navigate({
                            to: "/products/draft/$id",
                            params: { id: prd.product_id },
                          })
                        }
                      >
                        <Copy size={16} />
                      </Button>
                    </EditActions>
                  }
                />
              );
            })}
          </div>
        ) : (
          <div className="p-4">
            <DataTable
              data={productList?.data || []}
              columns={columns}
              isLoading={isLoading}
              pagination={{
                state: pagination,
                onPaginationChange: setPagination,
                total: productList?.total ?? paginationSchema.parse({}).limit,
              }}
              enableColumnVisibility={true}
              columnVisibilityStorageKey={
                TABLE_VISIBILITY_STORAGE_KEYS.PRODUCTS_TABLE
              }
              columnVisibilityAlign="start"
              sorting={sorting}
              onSortingChange={setSorting}
              columnFilters={columnFilters}
              onColumnFiltersChange={handleColumnFiltersChange}
            />
          </div>
        )
      ) : (
        <div className="flex size-full items-center justify-center">
          <p className="text-center text-black">No Data</p>
        </div>
      )}
    </div>
  );
};

export default ProductPage;
