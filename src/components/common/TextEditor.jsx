import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";
import PropTypes from 'prop-types';

const allowedVariables = ["receiver_name", "tracking_number", "merchant_name", "cod", "otp", "marketing_url", "address_update_url", "app_name", "receiver_email", "support_email"];

TextEditor.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onInvalidVariablesChange: PropTypes.func
};

function TextEditor({
    value,
    onChange,
    onInvalidVariablesChange
}) {
    const monacoInstance = useRef(null);
    const editorInstance = useRef(null);
    const [invalidVariables, setInvalidVariables] = useState([]);

    const themeMode = useMemo(() => {
        return localStorage.getItem("theme") === "dark" ? "vs-dark" : "light";
    }, []);

    const validateVariables = useCallback((text) => {
        const matches = [...text.matchAll(/\{\{(.*?)\}\}/g)];
        const variables = matches.map((match) => match[1]?.trim());
        const invalids = variables.filter((v) => !allowedVariables.includes(v));
        setInvalidVariables(invalids);
        if (onInvalidVariablesChange) {
            onInvalidVariablesChange(invalids);
        }
        return invalids;
    }, [onInvalidVariablesChange]);

    const handleEditorDidMount = (
        editor,
        monaco
    ) => {
        if (!monaco || !editor) return;
        monacoInstance.current = monaco;
        editorInstance.current = editor;

        monacoInstance.current.languages.register({ id: "customTemplate" });

        monacoInstance.current.languages.setMonarchTokensProvider("customTemplate", {
            tokenizer: {
                root: [[/\{\{.*?\}\}/, { token: "variable" }]],
            },
        });

        const model = editor.getModel();
        if (model) {
            monacoInstance.current.editor.setModelLanguage(model, "customTemplate");
        }
    };

    useEffect(() => {
        if (!monacoInstance.current || !editorInstance.current) return;

        const model = editorInstance.current.getModel();
        if (!model) return;

        const matches = [...value.matchAll(/\{\{(.*?)\}\}/g)];
        const markers = [];

        for (const match of matches) {
            const variable = match[1]?.trim();
            const start = match.index ?? 0;
            const end = start + match[0].length;

            if (!allowedVariables.includes(variable)) {
                const startPos = model.getPositionAt(start);
                const endPos = model.getPositionAt(end);
                markers.push({
                    severity: monacoEditor.MarkerSeverity.Warning,
                    message: `Invalid variable: ${variable}`,
                    startLineNumber: startPos.lineNumber,
                    startColumn: startPos.column,
                    endLineNumber: endPos.lineNumber,
                    endColumn: endPos.column,
                });
            }
        }

        monacoInstance.current.editor.setModelMarkers(model, "owner", markers);
        validateVariables(value);
    }, [value, validateVariables]);

    return (
        <div className="w-full">
            <Editor
                height="200px"
                value={value}
                onChange={(val) => onChange(val || "")}
                onMount={handleEditorDidMount}
                theme={themeMode}
                options={{
                    fontSize: 14,
                    fontFamily: "monospace",
                    minimap: { enabled: false },
                    lineNumbers: "off",
                    wordWrap: "on",
                    scrollBeyondLastLine: false,
                    padding: { top: 10 },
                }}
            />
            {invalidVariables.length > 0 && (
                <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                    ⚠️ The following variables are not allowed:{" "}
                    <span className="font-medium">{invalidVariables.join(", ")}</span>
                </div>
            )}
            <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                Note: You can use the following variables in the message body:{" "}
                <span className="font-medium">
                    {"{{receiver_name}}, {{tracking_number}}, {{otp}}, {{merchant_name}}, {{cod}}"}
                </span>
            </div>
        </div>
    );
}

export default TextEditor
