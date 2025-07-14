# File Attributes VS Code Extension README

This is a VS Code Extension that refers to `.gitattributes` and `.gitignore`, and displays a message at the top of files that are either auto-generated or not under source control.

Support languages: English(en), Čeština(cs), Deutsch(de), Español(es), Français(fr), Magyar(hu), Italiano(it), 日本語(ja), 한국어(ko), Polski(pl), Português Brasileiro(pt-br), Русский(ru), Türkçe(tr), 简体中文(zh-cn), 繁體中文(zh-tw)

## Screenshots

![Screenshot: "This file is auto-generated."](./images/screenshot.png)
![Screenshot: "This file is ignored by source control."](./images/screenshot2.png)

## Tutorial

### 0. ⬇️ Install File Attributes

Show extension side bar within VS Code(Mac:<kbd>Command</kbd>+<kbd>Shift</kbd>+<kbd>X</kbd>, Windows and Linux: <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>X</kbd>), type `file-attributes-vscode` and press <kbd>Enter</kbd> and click <kbd>Install</kbd>. Restart VS Code when installation is completed.

### 1. ✨️ Automatic Warning Display

This extension has no settings or commands. When you open files that are specified as auto-generated in `.gitattributes` or ignored by `.gitignore`, a warning message is automatically displayed at the top of the file.

Enjoy!

## Indicating Auto-Generated Files in `.gitattributes`

To explicitly mark files as auto-generated in your repository, you can use the `.gitattributes` file. By specifying certain attributes, you inform tools and contributors that these files are generated automatically and should not be manually edited.

For example, you can add the following line to your `.gitattributes` file:

```gitattributes
# Mark all files in the 'generated/' directory as auto-generated
generated/* linguist-generated=true
```

Or, to mark specific file types as auto-generated:

```gitattributes
# Mark all .pb.go files as auto-generated
*.pb.go linguist-generated=true
```

The `linguist-generated=true` attribute is recognized by many tools (such as GitHub) to identify generated files. This extension also uses this attribute to display a message at the top of the file in VS Code, warning users that the file is auto-generated.

**Note:** You can adjust the file patterns as needed for your project structure.

No further configuration is required—just maintain your `.gitattributes` file as usual.

## Indicating Ignored Files in `.gitignore`

To have this extension display a warning for files ignored by source control, add file patterns to your `.gitignore` file as you normally would. For example:

```gitignore
# Ignore all log files
*.log

# Ignore build output directories
/dist/
/build/
```

When you open a file in VS Code that matches a pattern in `.gitignore`, the extension will automatically show a message at the top of the file indicating it is ignored by source control.

No additional configuration is required—just maintain your `.gitignore` as usual.

## Release Notes

see ChangLog on [marketplace](https://marketplace.visualstudio.com/items/wraith13.file-attributes-vscode/changelog) or [github](https://github.com/wraith13/file-attributes-vscode/blob/master/CHANGELOG.md)

## Support

[GitHub Issues](https://github.com/wraith13/file-attributes-vscode/issues)

## License

[Boost Software License](https://github.com/wraith13/file-attributes-vscode/blob/master/LICENSE_1_0.txt)

## Download VSIX file ( for VS Code compatible softwares )

[Releases · wraith13/file-attributes-vscode](https://github.com/wraith13/file-attributes-vscode/releases)

## Other extensions of wraith13's work

|Icon|Name|Description|
|---|---|---|
|![](https://wraith13.gallerycdn.vsassets.io/extensions/wraith13/unsaved-files-vscode/2.1.1/1562823380255/Microsoft.VisualStudio.Services.Icons.Default) |[Unsaved Files](https://marketplace.visualstudio.com/items?itemName=wraith13.unsaved-files-vscode)|Easy access to unsaved files for VS Code.|
|![](https://wraith13.gallerycdn.vsassets.io/extensions/wraith13/file-path-bar/2.1.7/1657292091279/Microsoft.VisualStudio.Services.Icons.Default) |[File Path Bar](https://marketplace.visualstudio.com/items?itemName=wraith13.file-path-bar)|Show active file path in status bar.|
|![](https://wraith13.gallerycdn.vsassets.io/extensions/wraith13/open-in-github-desktop/1.4.3/1658183901851/Microsoft.VisualStudio.Services.Icons.Default) |[Open in GitHub Desktop](https://marketplace.visualstudio.com/items?itemName=wraith13.zoombar-vscode)|Open in GitHub Desktop from VS Code.|

See all wraith13's expansions: <https://marketplace.visualstudio.com/publishers/wraith13>
