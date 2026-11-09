import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GrantsContext } from "@/shared/permission";
import { FormSubmit } from "@/shared/ui/form-submit";

import type { TGrant } from "@/shared/permission";

const renderWith = (grants: TGrant[], disabled?: boolean) =>
  render(
    <GrantsContext.Provider value={() => grants}>
      <FormSubmit permission="users:update" disabled={disabled}>
        submit
      </FormSubmit>
    </GrantsContext.Provider>
  );

describe("FormSubmit (AC-4, §6.4)", () => {
  it("disabled with a hint when the grant is missing", () => {
    renderWith(["users:read"]);
    const button = screen.getByRole("button", { name: "submit" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("title", "users:update");
    expect(button).toHaveAttribute("type", "submit");
  });

  it("enabled with the grant (superadmin / resource wildcard)", () => {
    renderWith(["*"]);
    expect(screen.getByRole("button", { name: "submit" })).toBeEnabled();
  });

  it("still honours the form's own disabled flag", () => {
    renderWith(["users:*"], true);
    expect(screen.getByRole("button", { name: "submit" })).toBeDisabled();
  });

  it("without a grants provider it is disabled (fail-closed)", () => {
    render(<FormSubmit permission="users:update">submit</FormSubmit>);
    expect(screen.getByRole("button", { name: "submit" })).toBeDisabled();
  });
});
