import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold,
  Code2,
  FileCode2,
  Italic,
  List as BulletList,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  invalid?: boolean
  focusOnInvalid?: boolean
  ariaDescribedBy: string
}

interface ToolbarButtonProps {
  label: string
  active?: boolean
  disabled: boolean
  onClick: () => void
  children: ReactNode
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`grid size-9 place-items-center rounded-lg border text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:cursor-not-allowed disabled:opacity-40 ${
        active === true
          ? 'border-brand-500 bg-brand-100 text-brand-800'
          : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'
      }`}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({
  value,
  onChange,
  disabled = false,
  invalid = false,
  focusOnInvalid = false,
  ariaDescribedBy,
}: RichTextEditorProps) {
  const onChangeRef = useRef(onChange)
  const wasFocusOnInvalid = useRef(false)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        horizontalRule: false,
        link: {
          openOnClick: false,
          autolink: false,
          linkOnPaste: false,
          HTMLAttributes: {
            target: null,
            rel: null,
          },
        },
      }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-label': 'Note content',
        'aria-multiline': 'true',
        'aria-invalid': invalid ? 'true' : 'false',
        'aria-describedby': ariaDescribedBy,
        class: 'min-h-72 px-5 py-4 focus:outline-none sm:min-h-80',
      },
    },
    onUpdate: ({ editor: updatedEditor }) => {
      onChangeRef.current(
        updatedEditor.isEmpty ? '' : updatedEditor.getHTML(),
      )
    },
  })

  useEffect(() => {
    if (editor === null) {
      return
    }

    const matchesEmptyValue = value.length === 0 && editor.isEmpty

    if (!matchesEmptyValue && editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [editor, value])

  useEffect(() => {
    editor?.setEditable(!disabled)
  }, [disabled, editor])

  useEffect(() => {
    if (editor === null) {
      return
    }

    editor.view.dom.setAttribute('aria-invalid', invalid ? 'true' : 'false')

    if (invalid && focusOnInvalid && !wasFocusOnInvalid.current) {
      editor.commands.focus()
    }

    wasFocusOnInvalid.current = invalid && focusOnInvalid
  }, [editor, focusOnInvalid, invalid])

  const editorState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (currentEditor === null) {
        return {
          textStyle: 'paragraph',
          bold: false,
          italic: false,
          underline: false,
          strike: false,
          inlineCode: false,
          blockquote: false,
          bulletList: false,
          orderedList: false,
          codeBlock: false,
          canUndo: false,
          canRedo: false,
        }
      }

      const textStyle = currentEditor.isActive('heading', { level: 1 })
        ? 'heading-1'
        : currentEditor.isActive('heading', { level: 2 })
          ? 'heading-2'
          : currentEditor.isActive('heading', { level: 3 })
            ? 'heading-3'
            : 'paragraph'

      return {
        textStyle,
        bold: currentEditor.isActive('bold'),
        italic: currentEditor.isActive('italic'),
        underline: currentEditor.isActive('underline'),
        strike: currentEditor.isActive('strike'),
        inlineCode: currentEditor.isActive('code'),
        blockquote: currentEditor.isActive('blockquote'),
        bulletList: currentEditor.isActive('bulletList'),
        orderedList: currentEditor.isActive('orderedList'),
        codeBlock: currentEditor.isActive('codeBlock'),
        canUndo: currentEditor.can().chain().focus().undo().run(),
        canRedo: currentEditor.can().chain().focus().redo().run(),
      }
    },
  })

  const controlsDisabled = disabled || editor === null

  const changeTextStyle = (textStyle: string) => {
    if (editor === null) {
      return
    }

    if (textStyle === 'heading-1') {
      editor.chain().focus().toggleHeading({ level: 1 }).run()
      return
    }

    if (textStyle === 'heading-2') {
      editor.chain().focus().toggleHeading({ level: 2 }).run()
      return
    }

    if (textStyle === 'heading-3') {
      editor.chain().focus().toggleHeading({ level: 3 }).run()
      return
    }

    editor.chain().focus().setParagraph().run()
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-300 bg-white focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-100">
      <div
        role="group"
        aria-label="Text formatting"
        className="flex flex-wrap items-center gap-2 border-b border-stone-200 bg-stone-50 p-3"
      >
        <label className="sr-only" htmlFor="note-text-style">
          Text style
        </label>
        <select
          id="note-text-style"
          aria-label="Text style"
          value={editorState?.textStyle ?? 'paragraph'}
          disabled={controlsDisabled}
          onChange={(event) => changeTextStyle(event.target.value)}
          className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <option value="paragraph">Paragraph</option>
          <option value="heading-1">Heading 1</option>
          <option value="heading-2">Heading 2</option>
          <option value="heading-3">Heading 3</option>
        </select>

        <span aria-hidden="true" className="mx-1 h-6 w-px bg-stone-300" />

        <ToolbarButton
          label="Bold"
          active={editorState?.bold}
          disabled={controlsDisabled}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold aria-hidden="true" size={17} />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editorState?.italic}
          disabled={controlsDisabled}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic aria-hidden="true" size={17} />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={editorState?.underline}
          disabled={controlsDisabled}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <Underline aria-hidden="true" size={17} />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={editorState?.strike}
          disabled={controlsDisabled}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        >
          <Strikethrough aria-hidden="true" size={17} />
        </ToolbarButton>
        <ToolbarButton
          label="Inline code"
          active={editorState?.inlineCode}
          disabled={controlsDisabled}
          onClick={() => editor?.chain().focus().toggleCode().run()}
        >
          <Code2 aria-hidden="true" size={17} />
        </ToolbarButton>

        <span aria-hidden="true" className="mx-1 h-6 w-px bg-stone-300" />

        <ToolbarButton
          label="Blockquote"
          active={editorState?.blockquote}
          disabled={controlsDisabled}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <Quote aria-hidden="true" size={17} />
        </ToolbarButton>
        <ToolbarButton
          label="Bullet list"
          active={editorState?.bulletList}
          disabled={controlsDisabled}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <BulletList aria-hidden="true" size={17} />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editorState?.orderedList}
          disabled={controlsDisabled}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered aria-hidden="true" size={17} />
        </ToolbarButton>
        <ToolbarButton
          label="Code block"
          active={editorState?.codeBlock}
          disabled={controlsDisabled}
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
        >
          <FileCode2 aria-hidden="true" size={17} />
        </ToolbarButton>

        <span aria-hidden="true" className="mx-1 h-6 w-px bg-stone-300" />

        <ToolbarButton
          label="Undo"
          disabled={controlsDisabled || editorState?.canUndo !== true}
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <Undo2 aria-hidden="true" size={17} />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={controlsDisabled || editorState?.canRedo !== true}
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <Redo2 aria-hidden="true" size={17} />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} className="note-editor" />
    </div>
  )
}
