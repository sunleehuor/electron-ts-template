# Electon auto update

Electron auto update have 2 types.

- Electron updater: this option will update application directly
- Platform updater: this option will update only source code not application. `*Can update only not touch electron code`

## Electron updater

Electron updater will update as normal base on electron-updater docs. So developer need to upload files `linux.yaml` base on OS and `app.exe` base on OS as well.

## Platform updater

Platform updater is a custom update developer need to follow the flow update.

- Upload file `updates.json`
  ```js
  {
    version: "0.0.1",
    name: "appname"
  }
  ```
- Upload file `update.zip`
  This zip file is from dist folder after build so developer need to zip all of files inside `dist/renderer`.

After done client side can be update
