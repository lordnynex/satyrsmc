import { Extension } from "@tiptap/core";

export interface IndentOptions {
  types: string[];
  minLevel: number;
  maxLevel: number;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

export const Indent = Extension.create<IndentOptions>({
  name: "indent",

  addOptions() {
    return {
      types: ["paragraph", "heading", "blockquote", "bulletList", "orderedList", "taskList"],
      minLevel: 0,
      maxLevel: 8,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const indent = element.getAttribute("data-indent");
              return indent ? parseInt(indent, 10) : 0;
            },
            renderHTML: (attributes) => {
              if (!attributes.indent || attributes.indent === 0) {
                return {};
              }
              return {
                "data-indent": attributes.indent,
                style: `margin-left: ${attributes.indent * 2}rem`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    const listTypes = ["bulletList", "orderedList", "taskList"];
    const listItemTypes = ["listItem", "taskItem"];

    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;

          state.doc.nodesBetween(from, to, (node, pos, parent) => {
            if (!this.options.types.includes(node.type.name)) {
              return;
            }

            if (listTypes.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              if (currentIndent < this.options.maxLevel) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: currentIndent + 1,
                });
              }
              return false;
            }

            if (parent && listItemTypes.includes(parent.type.name)) {
              return;
            }

            const currentIndent = node.attrs.indent || 0;
            if (currentIndent < this.options.maxLevel) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                indent: currentIndent + 1,
              });
            }
          });

          if (dispatch) dispatch(tr);
          return true;
        },

      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;

          state.doc.nodesBetween(from, to, (node, pos, parent) => {
            if (!this.options.types.includes(node.type.name)) {
              return;
            }

            if (listTypes.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              if (currentIndent > this.options.minLevel) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: currentIndent - 1,
                });
              }
              return false;
            }

            if (parent && listItemTypes.includes(parent.type.name)) {
              return;
            }

            const currentIndent = node.attrs.indent || 0;
            if (currentIndent > this.options.minLevel) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                indent: currentIndent - 1,
              });
            }
          });

          if (dispatch) dispatch(tr);
          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    const isInList = () => {
      const { state } = this.editor;
      const { $from } = state.selection;
      for (let d = $from.depth; d > 0; d--) {
        const node = $from.node(d);
        if (["bulletList", "orderedList", "taskList", "listItem", "taskItem"].includes(node.type.name)) {
          return true;
        }
      }
      return false;
    };

    return {
      Tab: () => {
        if (isInList()) {
          return false;
        }
        return this.editor.commands.indent();
      },
      "Shift-Tab": () => {
        if (isInList()) {
          return false;
        }
        return this.editor.commands.outdent();
      },
    };
  },
});
