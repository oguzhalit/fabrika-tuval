import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  CheckSquare, 
  Quote, 
  Code
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Zengin notlar alın, strateji, formüller ve kaynakları listeleyin...'
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none min-h-[200px] p-4 text-black focus:outline-none text-sm leading-relaxed bg-white',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border-3 border-black bg-white shadow-[4px_4px_0px_0px_#000]">
      {/* Editör Araç Çubuğu */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#F5F0E6] border-b-3 border-black">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 border-2 border-black transition-colors ${
            editor.isActive('bold') ? 'bg-[#FFE600] text-black font-black' : 'bg-white hover:bg-stone-200'
          }`}
          title="Kalın"
        >
          <Bold className="w-4 h-4 stroke-[3]" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 border-2 border-black transition-colors ${
            editor.isActive('italic') ? 'bg-[#FFE600] text-black font-black' : 'bg-white hover:bg-stone-200'
          }`}
          title="İtalik"
        >
          <Italic className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div className="w-[2px] h-6 bg-black mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 border-2 border-black transition-colors ${
            editor.isActive('heading', { level: 2 }) ? 'bg-[#00C2CB] text-black font-black' : 'bg-white hover:bg-stone-200'
          }`}
          title="Başlık 2"
        >
          <Heading1 className="w-4 h-4 stroke-[2.5]" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 border-2 border-black transition-colors ${
            editor.isActive('heading', { level: 3 }) ? 'bg-[#00C2CB] text-black font-black' : 'bg-white hover:bg-stone-200'
          }`}
          title="Başlık 3"
        >
          <Heading2 className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div className="w-[2px] h-6 bg-black mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 border-2 border-black transition-colors ${
            editor.isActive('bulletList') ? 'bg-[#FFE600] text-black font-black' : 'bg-white hover:bg-stone-200'
          }`}
          title="Madde İşaretli Liste"
        >
          <List className="w-4 h-4 stroke-[2.5]" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 border-2 border-black transition-colors ${
            editor.isActive('orderedList') ? 'bg-[#FFE600] text-black font-black' : 'bg-white hover:bg-stone-200'
          }`}
          title="Numaralı Liste"
        >
          <ListOrdered className="w-4 h-4 stroke-[2.5]" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`p-1.5 border-2 border-black transition-colors ${
            editor.isActive('taskList') ? 'bg-[#22C55E] text-black font-black' : 'bg-white hover:bg-stone-200'
          }`}
          title="Kontrol Listesi"
        >
          <CheckSquare className="w-4 h-4 stroke-[2.5]" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 border-2 border-black transition-colors ${
            editor.isActive('blockquote') ? 'bg-[#FF6B35] text-white font-black' : 'bg-white hover:bg-stone-200'
          }`}
          title="Alıntı"
        >
          <Quote className="w-4 h-4 stroke-[2.5]" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1.5 border-2 border-black transition-colors ${
            editor.isActive('codeBlock') ? 'bg-black text-white font-black' : 'bg-white hover:bg-stone-200'
          }`}
          title="Kod Bloğu"
        >
          <Code className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Editör Metin Alanı */}
      <EditorContent editor={editor} />
    </div>
  );
};
