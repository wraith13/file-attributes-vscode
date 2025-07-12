'use strict';
import * as vscode from 'vscode';
import * as vscel from '@wraith13/vscel';
import packageJson from "../package.json";
import localeEn from "../package.nls.json";
import localeJa from "../package.nls.ja.json";
const configRoot = vscel.config.makeRoot(packageJson);
export const maxRecentlyFiles = configRoot.makeEntry<number>("external-files.maxRecentlyFiles", "root-workspace");
export type LocaleKeyType = keyof typeof localeEn;
//const locale =
vscel.locale.make(localeEn, { "ja": localeJa });
export namespace ExternalFiles
{
    const publisher = packageJson.publisher;
    const applicationKey = packageJson.name;
    export const isFolderOrFile = async (uri: vscode.Uri): Promise<"folder" | "file" | undefined> =>
    {
        try
        {
            const stat = await vscode.workspace.fs.stat(uri);
            switch(true)
            {
            case 0 < (stat.type & vscode.FileType.Directory):
                return "folder";
            case 0 < (stat.type & vscode.FileType.File):
                return "file";
            default:
                return undefined;
            }
        }
        catch
        {
            return undefined;
        }
    };
    export const isFile = async (uri: vscode.Uri): Promise<boolean> =>
        "file" === await isFolderOrFile(uri);
    export const isFolder = async (uri: vscode.Uri): Promise<boolean> =>
        "folder" === await isFolderOrFile(uri);
    export const getSubFolders = async (uri: vscode.Uri): Promise<vscode.Uri[]> =>
    {
        const stat = await vscode.workspace.fs.stat(uri);
        if (0 <= (stat.type & vscode.FileType.Directory))
        {
            const entries = await vscode.workspace.fs.readDirectory(uri);
            return entries
                .filter(i => 0 < (i[1] & vscode.FileType.Directory))
                .map(i => vscode.Uri.joinPath(uri, i[0]));
        }
        return [];
    };
    export const getFiles = async (uri: vscode.Uri): Promise<vscode.Uri[]> =>
    {
        const stat = await vscode.workspace.fs.stat(uri);
        if (0 <= (stat.type & vscode.FileType.Directory))
        {
            const entries = await vscode.workspace.fs.readDirectory(uri);
            return entries
                .filter(i => 0 < (i[1] & vscode.FileType.File))
                .map(i => vscode.Uri.joinPath(uri, i[0]));
        }
        return [];
    };
    export const getFolderPath = async (resourceUri: vscode.Uri): Promise<string | undefined> =>
    {
        switch(await isFolderOrFile(resourceUri))
        {
        case "folder":
            return resourceUri.fsPath;
        case "file":
            return vscode.Uri.joinPath(resourceUri, "..").fsPath;
        default:
            return undefined;
        }
    };
    const isRegularTextEditor = (editor: vscode.TextEditor): boolean =>
        undefined !== editor.viewColumn && 0 < editor.viewColumn;
    const isExternalFiles = (uri: vscode.Uri): boolean =>
        0 === (vscode.workspace.workspaceFolders ?? []).filter(i => uri.path.startsWith(i.uri.path)).length;
    const isExternalDocuments = (document: vscode.TextDocument): boolean =>
        ! document.isUntitled && isExternalFiles(document.uri);
    namespace Icons
    {
        export let folderIcon: vscode.IconPath;
        export let pinIcon: vscode.IconPath;
        export let historyIcon: vscode.IconPath;
        export const initialize = (context: vscode.ExtensionContext): void =>
        {
            folderIcon = new vscode.ThemeIcon("folder");
            pinIcon =
            {
                light: vscode.Uri.joinPath(context.extensionUri, "images", "pin.1024.svg"),
                dark: vscode.Uri.joinPath(context.extensionUri, "images", "pin-white.1024.svg"),
            };
            historyIcon =
            {
                light: vscode.Uri.joinPath(context.extensionUri, "images", "history.1024.svg"),
                dark: vscode.Uri.joinPath(context.extensionUri, "images", "history-white.1024.svg"),
            };
        };
    }
    export namespace Config
    {
        const root = vscel.config.makeRoot(packageJson);
        export namespace ViewOnExplorer
        {
            export const enabled = root.makeEntry<boolean>("external-files.viewOnExplorer.enabled", "root-workspace");
        }
    }
    export const makeCommand = (command: string, withActivate?: "withActivate") =>
        async (node: any) =>
        {
            if (withActivate)
            {
                await vscode.commands.executeCommand("vscode.open", node.resourceUri);
            }
            await vscode.commands.executeCommand(command, node.resourceUri);
        };
    export const initialize = (context: vscode.ExtensionContext): void =>
    {
        Icons.initialize(context);
        context.subscriptions.push
        (
            //  コマンドの登録
            vscode.commands.registerCommand(`${applicationKey}.revealFileInFinder`, makeCommand("revealFileInOS")),
            vscode.commands.registerCommand(`${applicationKey}.revealFileInExplorer`, makeCommand("revealFileInOS")),
            vscode.commands.registerCommand(`${applicationKey}.copyFilePath`, makeCommand("copyFilePath")),
            vscode.commands.registerCommand(`${applicationKey}.showActiveFileInExplorer`, makeCommand("workbench.files.action.showActiveFileInExplorer", "withActivate")),
            //vscode.window.registerTreeDataProvider(applicationKey, externalFilesProvider),
            //  イベントリスナーの登録
            vscode.window.onDidChangeActiveTextEditor(onDidChangeActiveTextEditor),
            //vscode.workspace.onDidOpenTextDocument(a => updateExternalDocuments(a)),
            vscode.workspace.onDidChangeConfiguration
            (
                event =>
                {
                    if (event.affectsConfiguration("external-files"))
                    {
                        onDidChangeConfiguration();
                    }
                }
            )
        );
        //RecentlyUsedExternalFiles.clear();
        updateViewOnExplorer();
        onDidChangeActiveTextEditor(vscode.window.activeTextEditor);
    };
    const onDidChangeActiveTextEditor = (editor: vscode.TextEditor | undefined): void =>
    {
        let isPinnedExternalFile = false;
        let isRecentlyUsedExternalFile = false;
        if (editor && isRegularTextEditor(editor))
        {
            isRecentlyUsedExternalFile = ! isPinnedExternalFile && isExternalDocuments(editor.document);
            updateExternalDocuments(editor.document);
        }
        vscode.commands.executeCommand
        (
            "setContext",
            `${publisher}.${applicationKey}.isPinnedExternalFile`,
            isPinnedExternalFile
        );
        vscode.commands.executeCommand
        (
            "setContext",
            `${publisher}.${applicationKey}.isRecentlyUsedExternalFile`,
            isRecentlyUsedExternalFile
        );
    };
    const updateExternalDocuments = async (_document: vscode.TextDocument) =>
    {
    };
    const onDidChangeConfiguration = (): void =>
    {
        updateViewOnExplorer();
    };
    const updateViewOnExplorer = (): void =>
    {
        vscode.commands.executeCommand
        (
            "setContext",
            "showExternalFilesViewOnexplorer",
            Config.ViewOnExplorer.enabled.get("default-scope")
        );
    };
}
export const activate = (context: vscode.ExtensionContext) : void =>
{
    ExternalFiles.initialize(context);
};
export const deactivate = () : void =>
{
};
