// eslint-disable-next-line import/no-named-as-default
import Image from "@tiptap/extension-image";
// eslint-disable-next-line import/no-named-as-default
import Link from "@tiptap/extension-link";
import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
// eslint-disable-next-line import/no-named-as-default, import/default
import DOMPurify from "dompurify";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  ImageIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import ImageDialog from "./dialogs/ImageDialog";
import LinkDialog from "./dialogs/LinkDialog";
import "./tiptap.css";

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const TiptapEditor = ({
  content,
  onChange,
  placeholder,
  className,
}: TiptapEditorProps) => {
  const { t } = useTranslation();
  const defaultPlaceholder = placeholder || t("validation.editor.placeholder");

  const [linkDialog, setLinkDialog] = useState({
    isOpen: false,
    url: "",
    text: "",
    isEditing: false,
  });

  const [imageDialog, setImageDialog] = useState({
    isOpen: false,
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: {},
        italic: {},
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        blockquote: {},
        paragraph: {},
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "tiptap-link",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "tiptap-image",
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: "ProseMirror",
        spellcheck: "false",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const cleanHtml = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          "p",
          "br",
          "strong",
          "em",
          "u",
          "s",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "ul",
          "ol",
          "li",
          "blockquote",
          "code",
          "pre",
          "a",
          "img",
        ],
        ALLOWED_ATTR: ["class", "href", "target", "rel", "src", "alt", "title"],
      });
      onChange(cleanHtml);
    },
    editable: true,
    immediatelyRender: false,
  });

  const handleLinkInsert = () => {
    if (!editor) return;

    const { selection } = editor.state;
    const selectedText = editor.state.doc.textBetween(
      selection.from,
      selection.to
    );

    setLinkDialog({
      isOpen: true,
      url: "",
      text: selectedText,
      isEditing: false,
    });
  };

  const handleLinkEdit = () => {
    if (!editor) return;

    const { href } = editor.getAttributes("link");
    const { selection } = editor.state;
    const selectedText = editor.state.doc.textBetween(
      selection.from,
      selection.to
    );

    setLinkDialog({
      isOpen: true,
      url: href || "",
      text: selectedText,
      isEditing: true,
    });
  };

  const handleLinkSave = (url: string, text?: string) => {
    if (!editor) return;

    const { selection } = editor.state;
    const selectedText = editor.state.doc.textBetween(
      selection.from,
      selection.to
    );

    if (text && text.trim()) {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${url}">${text}</a>`)
        .run();
    } else if (selectedText) {
      editor.chain().focus().setLink({ href: url }).run();
    } else {
      editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run();
    }
  };

  const handleLinkRemove = () => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
  };

  const handleImageInsert = () => {
    setImageDialog({ isOpen: true });
  };

  const handleImageSave = (imageUrl: string, alt?: string) => {
    if (!editor) return;

    editor
      .chain()
      .focus()
      .setImage({
        src: imageUrl,
        alt: alt || "",
        title: alt || "",
      })
      .run();
  };

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    isActive = false,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
  }) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      onClick();

      if (editor) {
        setTimeout(() => {
          editor.commands.focus();
        }, 0);
      }
    };

    return (
      <Button
        variant={isActive ? "default" : "outline"}
        size="sm"
        onClick={handleClick}
        onMouseDown={(e) => e.preventDefault()}
        title={title}
        type="button"
        className={cn(
          "toolbar-button size-8 p-0",
          isActive && "active bg-primary text-primary-foreground"
        )}
      >
        {children}
      </Button>
    );
  };

  return (
    <div
      className={cn(
        "tiptap-editor flex size-full flex-col rounded-md border",
        className
      )}
    >
      <div className="flex flex-wrap gap-1 border-b bg-muted/30 p-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title={t("validation.editor.toolbar.bold")}
        >
          <Bold className="size-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title={t("validation.editor.toolbar.italic")}
        >
          <Italic className="size-4" />
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-border" />

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          isActive={editor.isActive("heading", { level: 1 })}
          title={t("validation.editor.toolbar.heading1")}
        >
          <Heading1 className="size-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive("heading", { level: 2 })}
          title={t("validation.editor.toolbar.heading2")}
        >
          <Heading2 className="size-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor.isActive("heading", { level: 3 })}
          title={t("validation.editor.toolbar.heading3")}
        >
          <Heading3 className="size-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setParagraph().run()}
          isActive={editor.isActive("paragraph")}
          title={t("validation.editor.toolbar.paragraph")}
        >
          <Type className="size-4" />
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-border" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title={t("validation.editor.toolbar.bulletList")}
        >
          <List className="size-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title={t("validation.editor.toolbar.orderedList")}
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title={t("validation.editor.toolbar.blockquote")}
        >
          <Quote className="size-4" />
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-border" />

        <ToolbarButton
          onClick={() => {
            if (editor.isActive("link")) {
              handleLinkEdit();
            } else {
              handleLinkInsert();
            }
          }}
          isActive={editor.isActive("link")}
          title={t("validation.editor.toolbar.link")}
        >
          <LinkIcon className="size-4" />
        </ToolbarButton>

        {editor.isActive("link") && (
          <ToolbarButton
            onClick={handleLinkRemove}
            title={t("validation.editor.link.remove")}
          >
            <span className="text-xs">✕</span>
          </ToolbarButton>
        )}

        <ToolbarButton
          onClick={handleImageInsert}
          title={t("validation.editor.toolbar.image")}
        >
          <ImageIcon className="size-4" />
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-border" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title={t("validation.editor.toolbar.undo")}
        >
          <Undo className="size-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title={t("validation.editor.toolbar.redo")}
        >
          <Redo className="size-4" />
        </ToolbarButton>
      </div>

      <div className="min-h-[300px] flex-1">
        <EditorContent editor={editor} placeholder={defaultPlaceholder} />
      </div>

      <LinkDialog
        isOpen={linkDialog.isOpen}
        onClose={() => setLinkDialog((prev) => ({ ...prev, isOpen: false }))}
        onSave={handleLinkSave}
        initialUrl={linkDialog.url}
        initialText={linkDialog.text}
        isEditing={linkDialog.isEditing}
      />

      <ImageDialog
        isOpen={imageDialog.isOpen}
        onClose={() => setImageDialog({ isOpen: false })}
        onSave={handleImageSave}
      />
    </div>
  );
};

export default TiptapEditor;
