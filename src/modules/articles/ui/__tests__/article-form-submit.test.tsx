import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GrantsContext } from "@/shared/permission";
import { server } from "@/test/setup";
import { mountAsSuperadmin } from "@/test/sign-in";

import { articles } from "../../mocks/seed";
import ArticleForm from "../ArticleForm";

// matchRoute 必須跨 render 穩定（同真 router）：ArticleForm 以它為 memo 依賴，
// 每 render 換新會讓 data 變動、反覆 form.reset 蓋掉輸入
const route = vi.hoisted(() => {
  const state = { editId: "" };
  const matchRoute = () => (state.editId ? true : false);
  return Object.assign(state, { matchRoute });
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "zh" } }),
}));
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNavigate: () => vi.fn(),
  useMatchRoute: () => route.matchRoute,
  useParams: () => (route.editId ? { id: route.editId } : {}),
}));
vi.mock("@/shared/ui/navbar/navbar", () => ({
  Navbar: ({ children }: { children: React.ReactNode }) => (
    <nav>{children}</nav>
  ),
}));
// 檔案挑選 / 圖片 metadata 在 jsdom 不可用：以按鈕直接觸發 onUpload，上傳本身仍經 MSW `/admin/images`
vi.mock("@/shared/ui/image-upload/image-upload-dialog", () => ({
  default: ({
    onUpload,
  }: {
    onUpload: (name: string, b64: string) => void;
  }) => (
    <button
      type="button"
      onClick={() => onUpload("cover.webp", "data:image/webp;base64,AA==")}
    >
      upload-cover
    </button>
  ),
}));
vi.mock("../components/TiptapEditor", () => ({
  default: ({ onChange }: { onChange: (html: string) => void }) => (
    <textarea aria-label="content" onChange={(e) => onChange(e.target.value)} />
  ),
}));

type TCaptured = { method: string; body: Record<string, unknown> };
const writes: TCaptured[] = [];
// `/admin/images` 實際回傳的上傳結果（驗 image_url 帶完整 file_url，而非只有檔名）
const uploaded = { file_url: "" };
const onResponse = async ({
  request,
  response,
}: {
  request: Request;
  response: Response;
}) => {
  if (
    request.method === "POST" &&
    new URL(request.url).pathname === "/admin/images"
  )
    uploaded.file_url = (await response.clone().json()).file_url;
};
const onRequest = async ({ request }: { request: Request }) => {
  if (
    ["POST", "PUT"].includes(request.method) &&
    new URL(request.url).pathname === "/admin/articles"
  )
    writes.push({ method: request.method, body: await request.clone().json() });
};

const renderForm = () =>
  render(
    <GrantsContext.Provider value={() => ["*"]}>
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <ArticleForm />
      </QueryClientProvider>
    </GrantsContext.Provider>
  );

describe("ArticleForm 送出（P3）", () => {
  beforeEach(async () => {
    writes.length = 0;
    route.editId = "";
    await mountAsSuperadmin();
    uploaded.file_url = "";
    server.events.on("request:start", onRequest);
    server.events.on("response:mocked", onResponse);
  });
  afterEach(() => {
    server.events.removeListener("request:start", onRequest);
    server.events.removeListener("response:mocked", onResponse);
  });

  it("新增：上傳封面後可送出，POST body 帶上傳的 image_url", async () => {
    renderForm();

    fireEvent.change(screen.getByLabelText("articles.title"), {
      target: { value: "P3 new article" },
    });
    fireEvent.change(screen.getByLabelText("content"), {
      target: { value: "<p>body</p>" },
    });
    fireEvent.click(screen.getByRole("button", { name: "upload-cover" }));
    await screen.findByAltText("cover.webp");

    fireEvent.click(screen.getByRole("button", { name: "common.create" }));

    await waitFor(() => expect(writes).toHaveLength(1));
    expect(writes[0].method).toBe("POST");
    expect(uploaded.file_url).toBeTruthy();
    expect(writes[0].body).toMatchObject({
      title: "P3 new article",
      image_url: { file_name: "cover.webp", file_url: uploaded.file_url },
    });
  });

  it("編輯：不換封面送出，PUT body 保留原 image_url", async () => {
    const target = articles[0];
    route.editId = target.article_id;
    renderForm();

    await screen.findByDisplayValue(target.title);
    fireEvent.change(screen.getByLabelText("articles.title"), {
      target: { value: `${target.title} edited` },
    });
    fireEvent.change(screen.getByLabelText("content"), {
      target: { value: "<p>edited</p>" },
    });

    fireEvent.click(screen.getByRole("button", { name: "common.update" }));

    await waitFor(() => expect(writes).toHaveLength(1));
    expect(writes[0].method).toBe("PUT");
    expect(writes[0].body).toMatchObject({
      article_id: target.article_id,
      title: `${target.title} edited`,
      image_url: target.image_url,
    });
  });
});
