/**
 * Re-declare tiptap extension commands that are provided by packages installed
 * at the workspace root.  When `@tiptap/core` is hoisted into
 * packages/app-members/node_modules the module-augmentation in the extension
 * packages may point to a different copy and fail to merge.
 *
 * This file bridges the gap so TypeScript sees the chained commands.
 */

import "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    subscript: {
      setSubscript: () => ReturnType;
      toggleSubscript: () => ReturnType;
      unsetSubscript: () => ReturnType;
    };
    superscript: {
      setSuperscript: () => ReturnType;
      toggleSuperscript: () => ReturnType;
      unsetSuperscript: () => ReturnType;
    };
    color: {
      setColor: (color: string) => ReturnType;
      unsetColor: () => ReturnType;
    };
    textStyle: {
      removeEmptyTextStyle: () => ReturnType;
    };
  }
}
