import { isLastDayOfMonth } from "date-fns";
import { useState, useCallback } from "react";

interface AISuggestionsState {
  suggestion: string | null;
  isLoading: boolean;
  position: { line: number; column: number } | null;
  decoration: string[];
  isEnabled: boolean;
}

interface UseAISuggestionsReturn extends AISuggestionsState {
  toggleEnabled: () => void;
  fetchSuggestion: (type: string, editor: unknown) => Promise<void>;
  acceptSuggestion: (editor: unknown) => void;
  rejectSuggestion: (editor: unknown) => void;
  clearSuggestion: (editor: unknown) => void;
}

export const useAISuggestions = (): UseAISuggestionsReturn => {
  const [state, setState] = useState<AISuggestionsState>({
    suggestion: null,
    isLoading: false,
    position: null,
    decoration: [],
    isEnabled: true,
  });

  const toggleEnabled = useCallback(() => {
    setState((prev) => ({ ...prev, isEnabled: !prev.isEnabled }));
  }, []);

  const fetchSuggestion = useCallback(async (type: string, editor: unknown) => {
    setState((currentState) => {
      if (!currentState.isEnabled) {
        return currentState;
      }

      if (!editor) {
        return currentState;
      }

      const editorInstance = editor as {
        getModel: () => { getValue: () => string };
        getPosition: () => { lineNumber: number; column: number };
      };
      const model = editorInstance.getModel();
      const cursorPosition = editorInstance.getPosition();

      if (!model || !cursorPosition) {
        return currentState;
      }

      const newState = { ...currentState, isLoading: true };

      (async () => {
        try {
          const payload = {
            fileContent: model.getValue(),
            cursorLine: cursorPosition.lineNumber - 1,
            cursorColumn: cursorPosition.column - 1,
            suggestionType: type,
          };

          const response = await fetch("/api/code-completion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
          }

          const data = await response.json();

          if (data.suggestion) {
            const suggestionText = data.suggestion.trim();
            setState((prev) => ({
              ...prev,
              suggestion: suggestionText,
              position: {
                line: cursorPosition.lineNumber,
                column: cursorPosition.column,
              },
              isLoading: false,
            }));
          } else {
            console.warn("No suggestion received from API.");
            setState((prev) => ({ ...prev, isLoading: false }));
          }
        } catch (error) {
          console.error("Error fetching code suggestion:", error);
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      })();

      return newState;
    });
  }, []);

  const acceptSuggestion = useCallback(async (editor: unknown) => {
    setState((currentState) => {
      // Early return if nothing to accept
      if (!currentState.suggestion || !currentState.position || !editor) {
        return currentState;
      }
      return currentState;
    });

    // Get the latest state snapshot
    setState((currentState) => {
      if (!currentState.suggestion || !currentState.position || !editor) {
        return currentState;
      }

      const { line, column } = currentState.position;
      const sanitizedSuggestion = currentState.suggestion.replace(
        /^\d+:\s*/gm,
        ""
      );

      // Import monaco-editor dynamically
      import("monaco-editor").then(() => {
        const editorInstance = editor as {
          executeEdits: (
            id: string,
            edits: {
              range: import("monaco-editor").IRange;
              text: string;
              forceMoveMarkers?: boolean;
            }[]
          ) => void;
          deltaDecorations: (
            oldDecorations: string[],
            newDecorations: string[]
          ) => string[];
        };
        editorInstance.executeEdits("", [
          {
            range: {
              startLineNumber: line,
              startColumn: column,
              endLineNumber: line,
              endColumn: column,
            },
            text: sanitizedSuggestion,
            forceMoveMarkers: true,
          },
        ]);

        if (editorInstance && currentState.decoration.length > 0) {
          editorInstance.deltaDecorations(currentState.decoration, []);
        }
      });

      return {
        ...currentState,
        suggestion: null,
        position: null,
        decoration: [],
      };
    });
  }, []);

  const rejectSuggestion = useCallback((editor: unknown) => {
    setState((currentState) => {
      const editorInstance = editor as {
        deltaDecorations: (
          oldDecorations: string[],
          newDecorations: string[]
        ) => string[];
      };
      if (editorInstance && currentState.decoration.length > 0) {
        editorInstance.deltaDecorations(currentState.decoration, []);
      }

      return {
        ...currentState,
        suggestion: null,
        position: null,
        decoration: [],
      };
    });
  }, []);

  const clearSuggestion = useCallback((editor: unknown) => {
    setState((currentState) => {
      const editorInstance = editor as {
        deltaDecorations: (
          oldDecorations: string[],
          newDecorations: string[]
        ) => string[];
      };
      if (editorInstance && currentState.decoration.length > 0) {
        editorInstance.deltaDecorations(currentState.decoration, []);
      }
      return {
        ...currentState,
        suggestion: null,
        position: null,
        decoration: [],
      };
    });
  }, []);

  return {
    ...state,
    toggleEnabled,
    fetchSuggestion,
    acceptSuggestion,
    rejectSuggestion,
    clearSuggestion,
  };
};
