import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useMatchRoute, useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import ImageUploadDialog from "@/components/shared/dialog/ImageUploadDialog";
import { Navbar } from "@/components/shared/Navbar";
import Paper from "@/components/shared/Paper";
import { TextInput } from "@/components/shared/TextInputs";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useImgUpload } from "@/hooks/use-img-upload";
import { useValidationMessage } from "@/lib/gen-validate-message";
import { createGeneralImageValidationManager } from "@/plugins/image-validation";

import TiptapEditor from "./components/TiptapEditor";
import {
  useCreateArticle,
  useCreateArticleSchema,
  useGetArticle,
  useUpdateArticle,
} from "./hooks/use-article";

import type { TArticleFormData } from "./hooks/use-article";

type TArticleFormWithInputs = Omit<TArticleFormData, "image_url"> & {
  image_url?: TArticleFormData["image_url"];
  tagInputs?: string[];
};

const DEFAULT_VALUES: TArticleFormWithInputs = {
  title: "",
  describe: "",
  content_html: "",
  tags: [],
  image_url: undefined,
  tagInputs: ["", "", ""],
};

const ArticleFormPage = () => {
  const { t } = useTranslation();
  const validationMessage = useValidationMessage();
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();
  const routeParams = useParams({ strict: false });

  const imageValidationManager = useMemo(() => {
    return createGeneralImageValidationManager();
  }, []);

  const isEditMode = useMemo(() => {
    return matchRoute({
      to: "/articles/edit/$id",
      fuzzy: true,
    });
  }, [matchRoute]);

  const articleId = useMemo(() => {
    return routeParams?.id || "";
  }, [routeParams?.id]);

  const { data: articleData, isLoading: isLoadingArticle } = useGetArticle(
    isEditMode ? articleId : ""
  );

  const { mutate: createArticle, isPending: isCreateUploading } =
    useCreateArticle();
  const { mutate: updateArticle, isPending: isEditUpdating } =
    useUpdateArticle();
  const { upload, uploadedImages, removeImage } = useImgUpload();
  const articleFormSchema = useCreateArticleSchema();

  const editorContentRef = useRef("");

  const [isCurrentImageRemoved, setIsCurrentImageRemoved] = useState(false);

  const data = useMemo((): TArticleFormWithInputs => {
    if (!isEditMode || !articleData) return DEFAULT_VALUES;

    const existingTags = articleData.tags || [];
    const tagInputs = ["", "", ""];
    existingTags.forEach((tag, index) => {
      if (index < 3) {
        tagInputs[index] = tag;
      }
    });

    return {
      title: articleData.title,
      describe: articleData.describe || "",
      content_html: articleData.content_html,
      tags: articleData.tags || [],
      image_url: articleData.image_url,
      tagInputs,
    };
  }, [isEditMode, articleData]);

  const form = useForm<TArticleFormWithInputs>({
    resolver: zodResolver(
      articleFormSchema.extend({
        tagInputs: z.array(z.string()).optional(),
      })
    ),
    defaultValues: DEFAULT_VALUES,
    mode: "onChange",
  });

  useEffect(() => {
    if (isEditMode && data !== DEFAULT_VALUES) {
      form.reset(data);
      editorContentRef.current = data.content_html || "";
      setIsCurrentImageRemoved(false);
    }
  }, [isEditMode, data, form]);

  useEffect(() => {
    if (uploadedImages.length > 0) {
      setIsCurrentImageRemoved(false);
    }
  }, [uploadedImages.length]);

  useEffect(() => {
    const subscription = form.watch(
      (_: unknown, { name }: { name?: string }) => {
        if (name?.startsWith("tagInputs")) {
          const tagInputs = form.getValues("tagInputs") || [];
          const validTags = tagInputs.filter((tag: string) => tag.trim());

          const currentTags = form.getValues("tags") || [];
          const tagsChanged =
            validTags.length !== currentTags.length ||
            validTags.some((tag, index) => tag !== currentTags[index]);

          if (tagsChanged) {
            form.setValue("tags", validTags, {
              shouldDirty: false,
              shouldTouch: false,
            });
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = (formData: TArticleFormWithInputs) => {
    const editorContent = editorContentRef.current;

    if (!editorContent.trim() || editorContent === "<p></p>") {
      form.setError("content_html", {
        type: "required",
        message: t("validation.article.content.required"),
      });
      return;
    }

    if (!formData.image_url && uploadedImages.length === 0) {
      form.setError("image_url", {
        type: "required",
        message: validationMessage.getRequiredMessage(
          "pages.article.coverImage"
        ),
      });
      return;
    }
    const { tagInputs: _tagInputs, ...cleanFormData } = formData;

    let finalImageUrl;
    if (uploadedImages.length > 0) {
      finalImageUrl = uploadedImages[0];
    } else if (isCurrentImageRemoved) {
      form.setError("image_url", {
        type: "required",
        message: validationMessage.getRequiredMessage(
          "pages.article.coverImage"
        ),
      });
      return;
    } else {
      finalImageUrl = formData.image_url;
      if (!finalImageUrl) {
        form.setError("image_url", {
          type: "required",
          message: validationMessage.getRequiredMessage(
            "pages.article.coverImage"
          ),
        });
        return;
      }
    }

    const submitData = {
      ...cleanFormData,
      content_html: editorContent,
      image_url: finalImageUrl,
    };

    if (isEditMode && articleData) {
      updateArticle({
        article_id: articleData.article_id,
        ...submitData,
      });
    } else {
      createArticle(submitData);
    }
  };

  if (isEditMode && isLoadingArticle) {
    return (
      <div className="flex size-full items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <main className="flex size-full flex-col">
      <Navbar>
        <div className="flex w-full items-center justify-end gap-x-4">
          <Button
            variant="outline"
            onClick={() => navigate({ to: "/articles" })}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="article-form"
            disabled={isCreateUploading || isEditUpdating}
          >
            {isCreateUploading || isEditUpdating ? (
              <Spinner className="mr-2 size-4" />
            ) : null}
            {isEditMode ? t("common.update") : t("common.create")}
          </Button>
        </div>
      </Navbar>

      <form
        id="article-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex size-full flex-col gap-4 p-4"
      >
        <Paper className="flex w-full flex-col gap-4">
          <h3 className="text-2xl font-bold">{t("pages.article.basicInfo")}</h3>

          <div className="flex flex-col gap-4">
            <div>
              <TextInput
                id="title"
                label={t("pages.article.title")}
                placeholder={t("pages.article.titlePlaceholder")}
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="mt-1 text-sm text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <TextInput
              id="describe"
              label={t("pages.article.description")}
              placeholder={t("pages.article.descriptionPlaceholder")}
              {...form.register("describe")}
            />
          </div>
        </Paper>

        <Paper className="flex w-full flex-col gap-4">
          <h3 className="text-lg font-semibold">{t("pages.article.tags")}</h3>

          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
              <TextInput
                label={t("pages.article.tagInput", { index: 1 })}
                placeholder={t("pages.article.tagsPlaceholder")}
                {...form.register("tagInputs.0")}
                error={form.formState.errors.tagInputs?.[0]}
              />
              <TextInput
                label={t("pages.article.tagInput", { index: 2 })}
                placeholder={t("pages.article.tagsPlaceholder")}
                {...form.register("tagInputs.1")}
                error={form.formState.errors.tagInputs?.[1]}
              />
              <TextInput
                label={t("pages.article.tagInput", { index: 3 })}
                placeholder={t("pages.article.tagsPlaceholder")}
                {...form.register("tagInputs.2")}
                error={form.formState.errors.tagInputs?.[2]}
              />
            </div>

            {(form.watch("tags")?.length ?? 0) > 0 && (
              <div>
                <p className="mb-2 text-sm text-muted-foreground">
                  {t("pages.article.currentTags")}:
                </p>
                <div className="flex flex-wrap gap-2">
                  {form.watch("tags")?.map((tag, index) => (
                    <span
                      key={index}
                      className="rounded-md bg-secondary px-2 py-1 text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Paper>

        <Paper className="flex w-full flex-col gap-4">
          <h3 className="text-lg font-semibold">
            {t("pages.article.coverImage")}
          </h3>

          {uploadedImages.length > 0 ||
          (isEditMode && data.image_url && !isCurrentImageRemoved) ? (
            <div className="group relative flex h-[300px] w-fit min-w-[300px] items-center justify-center overflow-hidden rounded-lg border">
              <img
                src={
                  uploadedImages.length > 0
                    ? uploadedImages[0].file_url
                    : data.image_url?.file_url
                }
                alt={
                  uploadedImages.length > 0
                    ? uploadedImages[0].file_name
                    : data.image_url?.file_name
                }
                className="size-full object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:text-red-500"
                  onClick={() => {
                    if (uploadedImages.length > 0) {
                      removeImage(uploadedImages[0].file_name);
                    } else {
                      setIsCurrentImageRemoved(true);
                    }
                  }}
                  type="button"
                  title={t("action.remove")}
                >
                  <Trash2 className="size-5" />
                </Button>
              </div>
            </div>
          ) : (
            <ImageUploadDialog
              onUpload={upload}
              validationManager={imageValidationManager}
            />
          )}

          {form.formState.errors.image_url && (
            <p className="mt-1 text-sm text-destructive">
              {form.formState.errors.image_url.message}
            </p>
          )}
        </Paper>

        <Paper className="flex w-full flex-1 flex-col gap-4">
          <h3 className="text-lg font-semibold">
            {t("pages.article.content")}
          </h3>

          <div className="flex-1">
            <TiptapEditor
              content={data.content_html || ""}
              onChange={(content) => (editorContentRef.current = content)}
              placeholder={t("pages.article.contentPlaceholder")}
              className="h-full min-h-[400px]"
            />
            {form.formState.errors.content_html && (
              <p className="mt-1 text-sm text-destructive">
                {form.formState.errors.content_html.message}
              </p>
            )}
          </div>
        </Paper>
      </form>
    </main>
  );
};

export default ArticleFormPage;
