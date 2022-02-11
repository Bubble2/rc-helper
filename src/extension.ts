// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import fetch from 'node-fetch';
import { IImportDeclarations, getImportDeclarations } from './utils/getImportDeclarations';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // 追踪当前webview面板
    let currentPanel: vscode.WebviewPanel | undefined = undefined;

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('material.start', async () => {
        const viewColumn = vscode.ViewColumn.Nine
        const settingData: [] | undefined = context.workspaceState.get('settingData');
        if (currentPanel && !settingData) {
            // 如果我们已经有了一个面板，那就把它显示到目标列布局中
            currentPanel.reveal(viewColumn);
        } else {
            currentPanel = vscode.window.createWebviewPanel(
                'rcHelper',
                'rc helper',
                viewColumn,
                {
                    enableScripts: true
                }
            )

            // 处理webview中的信息
            currentPanel.webview.onDidReceiveMessage(async message => {
                switch (message.command) {
                    case 'insertComponent':
                        await insertComponent(message.text, message.cateInfo);
                        break;
                    case 'settingData':
                        await context.workspaceState.update('settingData', message.settingData);
                        vscode.commands.executeCommand('material.start');
                        break;
                }
            }, undefined, context.subscriptions);

            const rootFolders = vscode.workspace.workspaceFolders;
            let rootFolder: any = '';
            if (rootFolders) {
                rootFolder = rootFolders[0].uri.path.slice(1)
            }

            let componentFolders: { key: string, cateName?: string, importPath?: string, path: string }[] = []
            const directories: object[] = []

            if (settingData && settingData.length && settingData.length > 0) {
                componentFolders = settingData.map((item: any) => {
                    return {
                        key: item.foldPath,
                        cateName: item.foldName,
                        importPath: item.importPath,
                        path: path.join(rootFolder, item.foldPath)
                    }
                })
            } else {
                componentFolders.push({
                    key: 'component/biz',
                    cateName: '业务组件',
                    importPath: '@components/biz',
                    path: path.join(rootFolder, '/src/components/biz')
                },
                    {
                        key: 'component/widgets',
                        cateName: '基础组件',
                        importPath: '@components/widgets',
                        path: path.join(rootFolder, '/src/components/widgets')
                    })
            }



            for (let i = 0; i < componentFolders.length; i++) {
                const componentFoldersUri = vscode.Uri.file(componentFolders[i].path)
                const snapshot: any = {}
                let res: any = {}
                try {
                    res = await vscode.workspace.fs.readDirectory(componentFoldersUri)
                    for (let j = 0; j < res.length; j++) {
                        const snapshotFilePath = vscode.Uri.file(componentFolders[i].path + '/' + res[j][0] + '/' + 'snapshot.jpg')
                        // console.log('snapshotFilePath',snapshotFilePath)
                        const statSnapshotFile = await vscode.workspace.fs.stat(snapshotFilePath)
                        console.log('statSnapshotFile', statSnapshotFile)
                        if (statSnapshotFile) {
                            snapshot[res[j][0]] = `${currentPanel.webview.asWebviewUri(snapshotFilePath)}`
                        }
                    }
                } catch (error) {
                    console.log(error)
                }
                directories.push({ ...componentFolders[i], files: res, snapshot })
            }

            console.log('directories', directories)
            currentPanel.webview.postMessage({
                command: 'getDirectories',
                directories: directories
            })

            currentPanel.webview.html = await getHtmlContent(context.extensionPath)

            // 当前面板被关闭后重置
            currentPanel.onDidDispose(
                () => {
                    currentPanel = undefined;
                },
                null,
                context.subscriptions
            );



            onChangeActiveTextEditor(context)
        }

    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }

async function getHtmlContent(extensionPath: string) {
    const resourcePath = path.join(extensionPath, 'dist/build/index.html');
    const dirPath = path.dirname(resourcePath);
    try {
        //开发环境
        // const response = await fetch('http://localhost:3000');
        // let html = await response.text();
        // html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
        //     return $1 + 'http://localhost:3000' + $2 + '"';
        // });
        //生产环境
        let html = fs.readFileSync(resourcePath, 'utf-8');
        html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
            return $1 + vscode.Uri.file(path.resolve(dirPath, `.${$2}`)).with({ scheme: 'vscode-resource' }).toString() + '"';
        });
        return html;
    } catch (error) {
        console.log(error)
    }
    return ''
}

let activeTextEditorId: string;
const { window, Position } = vscode;

function getLastAcitveTextEditor() {
    const { visibleTextEditors } = window;
    const activeTextEditor = visibleTextEditors.find((item: any) => item.id === activeTextEditorId);
    console.log('window.activeTextEditor:', activeTextEditor);
    return activeTextEditor;
}

function setLastActiveTextEditorId(id: string) {
    console.log('setLastActiveTextEditorId: run');
    activeTextEditorId = id;
}

interface IImportInfos {
    position: vscode.Position;
    declarations: IImportDeclarations[];
}

export async function getImportInfos(text: string): Promise<IImportInfos> {
    const importDeclarations: IImportDeclarations[] = await getImportDeclarations(text);

    const { length } = importDeclarations;
    let position;
    if (length) {
        position = new Position(importDeclarations[length - 1].loc.end.line, 0);
    } else {
        position = new Position(0, 0);
    }
    return { position, declarations: importDeclarations };
}

function onChangeActiveTextEditor(context: vscode.ExtensionContext) {
    vscode.window.onDidChangeActiveTextEditor(
        (editor) => {
            if (editor) {
                const { fsPath } = editor.document.uri;
                const isJSXFile = fsPath.match(/^.*\.(jsx?|tsx)$/g);
                vscode.commands.executeCommand('setContext', 'appworks:isJSXFile', isJSXFile);

                // save active text editor id
                const { id } = editor as any;
                console.log('activeTextEditor Id', id);
                setLastActiveTextEditorId(id);
            }
        },
        null,
        context.subscriptions,
    );
}

async function insertComponent(componentName: string, cateInfo: {}) {
    const activeTextEditor = getLastAcitveTextEditor();
    if (!activeTextEditor) {
        throw new Error('error');
    }

    const { fsPath } = activeTextEditor.document.uri;

    const pagePath = path.dirname(fsPath);
    const pageName = path.basename(pagePath);
    await insertBlock(activeTextEditor, componentName, cateInfo);
}

function tf(str: string) {
    var re = /-(\w)/g;
    const firstLetter = str.slice(0, 1);
    const restLetter = str.slice(1);
    const resolvedStr = firstLetter.toUpperCase() + '' + restLetter;
    return resolvedStr.replace(re, function ($0, $1) {
        return $1.toUpperCase();
    });
};

async function insertBlock(activeTextEditor: vscode.TextEditor, componentName: string, cateInfo: { importPath?: string }) {
    const { position: importDeclarationPosition } = await getImportInfos(activeTextEditor.document.getText());

    activeTextEditor.edit((editBuilder: vscode.TextEditorEdit) => {
        editBuilder.insert(importDeclarationPosition, `import ${tf(componentName)} from "${cateInfo.importPath}/${componentName}" \n`);

        const { selection } = activeTextEditor;
        if (selection && selection.active) {
            const insertPosition = new Position(selection.active.line, selection.active.character);
            editBuilder.insert(insertPosition, `<${tf(componentName)} />`);
        }
    })
}

