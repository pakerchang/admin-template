import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DataTable from "@/components/shared/DataTable";
import EditActions from "@/components/shared/EditActions";
import { GrantsContext } from "@/shared/permission";

import type { TRowAction } from "@/components/shared/table/row-actions";
import type { TGrant } from "@/shared/permission";
import type { ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";

type TRow = { id: string };
const rows: TRow[] = [{ id: "r1" }];
const columns: ColumnDef<TRow>[] = [{ accessorKey: "id", header: "id" }];

const withGrants = (grants: TGrant[], ui: ReactNode) =>
  render(
    <GrantsContext.Provider value={() => grants}>{ui}</GrantsContext.Provider>
  );

const onEdit = vi.fn();
const actions: TRowAction<TRow>[] = [
  { id: "edit", label: "edit", permission: "users:update", onSelect: onEdit },
  {
    id: "role",
    label: "role",
    permission: "users:update-role",
    onSelect: vi.fn(),
  },
  {
    id: "export",
    label: "export",
    permission: "users:export",
    denied: "disable",
    onSelect: vi.fn(),
  },
];

const table = (grants: TGrant[]) =>
  withGrants(
    grants,
    <DataTable
      data={rows}
      columns={columns}
      rowActions={actions}
      rowActionsHeader="actions"
    />
  );

describe("DataTable rowActions (AC-4, §6.4)", () => {
  it("hides denied actions by default and disables denied:'disable' ones", () => {
    table(["users:update"]);
    expect(screen.getByRole("button", { name: "edit" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "role" })).toBeNull();
    expect(screen.getByRole("button", { name: "export" })).toBeDisabled();
    expect(screen.getByText("actions")).toBeInTheDocument();
  });

  it("calls onSelect with the row", () => {
    table(["users:update"]);
    fireEvent.click(screen.getByRole("button", { name: "edit" }));
    expect(onEdit).toHaveBeenCalledWith({ id: "r1" });
  });

  it("superadmin sees every action enabled (AC-6)", () => {
    table(["*"]);
    for (const name of ["edit", "role", "export"])
      expect(screen.getByRole("button", { name })).toBeEnabled();
  });

  it("no rowActions → no extra column", () => {
    withGrants(["*"], <DataTable data={rows} columns={columns} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});

describe("EditActions permission objects (§6.4)", () => {
  const ui = (
    <EditActions
      onEdit={{ handler: vi.fn(), permission: "orders:update" }}
      onView={{ handler: vi.fn(), permission: "orders:read" }}
      onDelete={{ handler: vi.fn(), permission: "orders:delete" }}
    />
  );

  it("renders only the permitted actions", () => {
    withGrants(["orders:read"], ui);
    expect(screen.getAllByRole("button").map((b) => b.title)).toEqual([
      "common.view",
    ]);
  });

  it("orders:* shows all three", () => {
    withGrants(["orders:*"], ui);
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });
});
