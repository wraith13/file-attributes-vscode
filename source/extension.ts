'use strict';
import * as vscode from "vscode";
import localeEn from "../package.nls.json";
import localeCs from "../package.nls.cs.json";
import localeDe from "../package.nls.de.json";
import localeEs from "../package.nls.es.json";
import localeFr from "../package.nls.fr.json";
import localeHu from "../package.nls.hu.json";
import localeIt from "../package.nls.it.json";
import localeJa from "../package.nls.ja.json";
import localeKo from "../package.nls.ko.json";
import localePl from "../package.nls.pl.json";
import localePtBr from "../package.nls.pt-br.json";
import localeRu from "../package.nls.ru.json";
import localeTr from "../package.nls.tr.json";
import localeZhCn from "../package.nls.zh-cn.json";
import localeZhTw from "../package.nls.zh-tw.json";
export namespace Locale
{
    export type LocaleKeyType = keyof typeof localeEn;
    export const localeTable =
    {
        "en": localeEn,
        "cs": localeCs,
        "de": localeDe,
        "es": localeEs,
        "fr": localeFr,
        "hu": localeHu,
        "it": localeIt,
        "ja": localeJa,
        "ko": localeKo,
        "pl": localePl,
        "pt-br": localePtBr,
        "ru": localeRu,
        "tr": localeTr,
        "zh-cn": localeZhCn,
        "zh-tw": localeZhTw,
    } as const;
    export const getLocale = (language: string = vscode.env.language.toLowerCase()): keyof typeof localeTable =>
        Object.keys(localeTable).includes(language) ? language as keyof typeof localeTable: "en";
    export const string = (key: string): string => localeTable[getLocale()][key as LocaleKeyType] || key;
    export const map = (key: LocaleKeyType & string): string => string(key);
}
export namespace FileAttributes
{
    const DEBUG = false;
    export const findGitFileUri = (gitfile: string) =>
        async (uri: vscode.Uri): Promise<vscode.Uri | undefined> =>
        {
            let current = uri;
            while(true)
            {
                const candidate = vscode.Uri.joinPath(current, gitfile);
                try
                {
                    await vscode.workspace.fs.stat(candidate);
                    return candidate;
                }
                catch
                {
                }
                const parent = vscode.Uri.joinPath(current, "..");
                if (parent.fsPath === current.fsPath)
                {
                    return undefined;
                }
                current = parent;
            }
        };
    export const findGitIgnoreUri = findGitFileUri(".gitignore");
    export const findGitAttributesUri = findGitFileUri(".gitattributes");
    export const parseGitAttributes = async (gitAttributesUri: vscode.Uri): Promise<{ pattern: string, attrs: string[] }[]> =>
    {
        try
        {
            const gitattributesContent = await vscode.workspace.fs.readFile(gitAttributesUri);
            const content = Buffer.from(gitattributesContent).toString("utf8");
            return content
                .split(/\r?\n/)
                .map(line => line.trim())
                .filter(line => line && !line.startsWith("#"))
                .map
                (
                    line =>
                    {
                        const [pattern, ...attrs] = line.split(/\s+/);
                        return { pattern, attrs };
                    }
                );
        }
        catch
        {
            return [];
        }
    };
    export const matchGitAttributes = async (gitAttributesUri: vscode.Uri, uri: vscode.Uri): Promise<{ pattern: string, attrs: string[] } | undefined> =>
    {
        if (gitAttributesUri)
        {
            const entries = await parseGitAttributes(gitAttributesUri);
            // ワークスペースルートを取得
            const wsFolder = vscode.workspace.getWorkspaceFolder(uri);
            const relPath = wsFolder ?
                vscode.workspace.asRelativePath(uri, false).replace(/\\/g, "/"):
                uri.fsPath.replace(/\\/g, "/");
            let lastMatched: { pattern: string, attrs: string[] } | undefined = undefined;
            let lastMatchedPattern = "";
            for (const entry of entries)
            {
                let pattern = entry.pattern.trim();
                // * のみはルート直下のファイルだけ
                if ("*" === pattern)
                {
                    if ( ! relPath.includes("/") && /[^/]+\.[^/]+$/.test(relPath))
                    {
                        lastMatched = entry;
                        lastMatchedPattern = entry.pattern;
                    }
                    continue;
                }
                // 先頭/末尾の / を考慮
                if (pattern.startsWith("/"))
                {
                    pattern = pattern.slice(1);
                }
                if (pattern.endsWith("/"))
                {
                    pattern = pattern +"**";
                }
                // **/ → (任意のディレクトリ/)
                pattern = pattern.replace(/\*\*\//g, "(?:.*/)?");
                // /** → (任意の/で終わる)
                pattern = pattern.replace(/\/\*\*$/g, "(?:/.*)?");
                // ** → 任意のディレクトリ
                pattern = pattern.replace(/\*\*/g, ".*");
                // * → パス区切りをまたがないワイルドカード
                pattern = pattern.replace(/\*/g, "[^/]*");
                pattern = pattern.replace(/\./g, "\\.");
                // 拡張子完全一致のための修正
                // 例: *.css → .cssで終わるものだけ
                if (/\\\.\w+$/.test(pattern)) {
                    pattern = pattern + "$";
                }
                if ( ! pattern.startsWith("(?:.*/)?"))
                {
                    pattern = "(?:.*/)?" + pattern;
                }
                const regex = new RegExp("^" + pattern + "$");
                if (regex.test(relPath))
                {
                    lastMatched = entry;
                    lastMatchedPattern = entry.pattern;
                }
            }
            if (DEBUG)
            {
                (globalThis as any)._lastMatchedPattern = lastMatchedPattern;
            }
            return lastMatched;
        }
        return undefined;
    };
    export const isGenericFile = async (uri: vscode.Uri): Promise<boolean | undefined> =>
    {
        const gitAttributesUri = await findGitAttributesUri(uri);
        if (gitAttributesUri)
        {
            const matched = await matchGitAttributes(gitAttributesUri, uri);
            if (matched)
            {
                const autoGeneratedAttrs = [ "linguist-generated", "generated" ];
                return matched.attrs.some
                (
                    attr => autoGeneratedAttrs.some
                    (
                        genAttr => attr === genAttr || attr === `${genAttr}=true`
                    )
                );
            }
        }
        return undefined;
    };
    export const isIgnoredFile = async (uri: vscode.Uri): Promise<boolean | undefined> =>
    {
        const gitignoreUri = await findGitIgnoreUri(uri);
        if (gitignoreUri)
        {
            try
            {
                const content = Buffer.from(await vscode.workspace.fs.readFile(gitignoreUri)).toString("utf8");
                const lines = content.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith("#"));
                const filePath = uri.fsPath.replace(/\\/g, "/");
                for(const pattern of lines)
                {
                    if (pattern.endsWith("/"))
                    {
                        // ディレクトリ指定: out/ → out/配下すべて
                        const absDir = vscode.Uri.joinPath(gitignoreUri, "..", pattern).fsPath.replace(/\\/g, "/");
                        if (filePath.startsWith(absDir))
                        {
                            return true;
                        }
                    }
                    else
                    {
                        // ディレクトリ名指定（スラッシュなし）: out → out/配下すべて
                        const absDir = vscode.Uri.joinPath(gitignoreUri, "..", pattern).fsPath.replace(/\\/g, "/");
                        if (
                            filePath === absDir ||
                            filePath.startsWith(absDir + "/")
                        )
                        {
                            return true;
                        }
                    }
                }
                return false;
            }
            catch
            {
                return undefined;
            }
        }
        return undefined;
    };
    const isRegularTextEditor = (editor: vscode.TextEditor): boolean =>
        undefined !== editor.viewColumn && 0 < editor.viewColumn;
    const isExternalFiles = (uri: vscode.Uri): boolean =>
        0 === (vscode.workspace.workspaceFolders ?? []).filter(i => uri.path.startsWith(i.uri.path)).length;
    const isExternalDocuments = (document: vscode.TextDocument): boolean =>
        ! document.isUntitled && isExternalFiles(document.uri);
    const bannerDecorationType = vscode.window.createTextEditorDecorationType
    ({
        isWholeLine: true,
        after:
        {
            contentText: "",
        },
    });
    export const initialize = (context: vscode.ExtensionContext): void =>
    {
        context.subscriptions.push
        (
            vscode.window.onDidChangeActiveTextEditor(onDidChangeActiveTextEditor),
            bannerDecorationType
        );
        onDidChangeActiveTextEditor(vscode.window.activeTextEditor);
    };
    const getBannerText = async (editor: vscode.TextEditor): Promise<string | undefined> =>
    {
        if (DEBUG)
        {
            const gitAttributesUri = await findGitAttributesUri(editor.document.uri);
            const gitignoreUri = await findGitIgnoreUri(editor.document.uri);
            // relPath 取得
            const wsFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
            const relPath = wsFolder ?
                vscode.workspace.asRelativePath(editor.document.uri, false).replace(/\\/g, "/"):
                editor.document.uri.fsPath.replace(/\\/g, "/");
            // gitattributes の最後にマッチしたパターンを取得
            const matchedPattern = (globalThis as any)._lastMatchedPattern || "";
            const generic = await isGenericFile(editor.document.uri);
            const ignored = await isIgnoredFile(editor.document.uri);
            return `DEBUG: relPath=${relPath}, .gitattributes=${gitAttributesUri ? "found": "not found"}, matchedPattern=${matchedPattern}, .gitignore=${gitignoreUri ? "found": "not found"}, isGenericFile=${String(generic)}, isIgnoredFile=${String(ignored)}`;
        }
        else
        if (isExternalDocuments(editor.document))
        {
            return Locale.map("This file is outside the workspace.");
        }
        else
        if (await isGenericFile(editor.document.uri))
        {
            return Locale.map("This file is auto-generated.");
        }
        else
        if (await isIgnoredFile(editor.document.uri))
        {
            return Locale.map("This file is ignored by source control.");
        }
        return undefined;
    };
    const onDidChangeActiveTextEditor = (editor: vscode.TextEditor | undefined): void =>
    {
        if (editor && isRegularTextEditor(editor))
        {
            (async () =>
                {
                    const bannerText = await getBannerText(editor);
                    if (bannerText)
                    {
                        editor.setDecorations
                        (
                            bannerDecorationType,
                            [{
                                range: new vscode.Range(0, 0, 0, 0),
                                renderOptions:
                                {
                                    after:
                                    {
                                        contentText: ` ${bannerText} `,
                                        margin: "0 0 0 0",
                                        color: new vscode.ThemeColor("editorWarning.foreground"),
                                        backgroundColor: new vscode.ThemeColor("editorWarning.background"),
                                        fontWeight: "bold",
                                    }
                                }
                            }]
                        );
                    }
                    else
                    {
                        editor.setDecorations(bannerDecorationType, []);
                    }
                }
            )();
        }
        else
        if (editor)
        {
            editor.setDecorations(bannerDecorationType, []);
        }
    };
}
export const activate = (context: vscode.ExtensionContext): void =>
{
    FileAttributes.initialize(context);
};
export const deactivate = (): void =>
{
};
