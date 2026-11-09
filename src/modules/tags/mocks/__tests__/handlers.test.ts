import { beforeEach, describe, expect, it } from "vitest";

import { ApiError } from "@/shared/api/fetcher";
import { mountAsSuperadmin } from "@/test/sign-in";

import { createTag, listTags, updateTag } from "../../api/tags";

describe("tags mock handlers: orval handler override + hand-written non-200 (M7 AC-6)", () => {
  beforeEach(mountAsSuperadmin);

  it("create then list reads it back (seed memory state via orval override)", async () => {
    await createTag({ tag_name: "ac6-tag" });
    const { data } = await listTags({ search: "ac6-tag" });
    expect(data?.map((t) => t.tag_name)).toEqual(["ac6-tag"]);
  });

  it("PUT an unknown id → 404 from the hand-written handler placed before orval's", async () => {
    const error = await updateTag({ tag_id: "tag-nope", tag_name: "x" }).catch(
      (e: unknown) => e
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, body: { error: "Not found" } });
  });

  it("PUT an existing id falls through to the orval handler and updates", async () => {
    expect(
      await updateTag({ tag_id: "tag-1", tag_name: "ac6-renamed" })
    ).toEqual({ message: "updated" });
    const { data } = await listTags({ search: "ac6-renamed" });
    expect(data?.map((t) => t.tag_id)).toEqual(["tag-1"]);
  });
});
