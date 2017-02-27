# Fabric Composer Extension for VSCode 

This VSCode extension parses .cto files using the Fabric Composer parser
and reports any validatione errors. It is currently beta and may have issues
with models that use imports and span multiple files.

## Manual Build and Install

Generate the installable VSIX file:

`
git clone https://github.com/fabric-composer/tools.git
cd tools
cd composer-vscode-plugin/client
npm install
npm run package
`

1. Launch VSCode
2. View > Extensions
3. Press the ... and select "Install from VSIX"
4. Browse to the VSIX file
5. Install and restart VSCode
6. Open a .cto file

