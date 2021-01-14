

<p align="middle" ><img src="https://raw.githubusercontent.com/daybrush/react-folder/master/public/logo.png"/></p>
<h2 align="middle">React Folder</h2>
<p align="middle">
<a href="https://www.npmjs.com/package/@scena/react-folder" target="_blank"><img src="https://img.shields.io/npm/v/@scena/react-folder.svg?style=flat-square&color=007acc&label=version" alt="npm version" /></a>
<img src="https://img.shields.io/badge/language-typescript-blue.svg?style=flat-square"/>
<a href="https://github.com/daybrush/react-folder/blob/master/LICENSE" target="_blank"><img src="https://img.shields.io/github/license/daybrush/react-folder.svg?style=flat-square&label=license&color=08CE5D"/></a>
</p>
<p align="middle">A React Folder component that can fold, sort, and move lists.</p>
<p align="middle">
  <a href="https://codesandbox.io/s/react-folder-demo-0p7i2"><strong>Demo</strong></a> /
  <a href="https://github.com/daybrush/scena" target="_blank"><strong>Main Project</strong></a>
</p>


## ⚙️ Installation
### npm
```sh
$ npm i @scena/react-folder
```

## 🚀 How to use
* React Folder's props
```ts
export interface FolderProps<T> {
  infos: T[];
  originalInfos?: T[];
  FileComponent: ((props: FileProps<T>) => any) | typeof File;

  scope?: string[];
  selected?: string[] | null;
  multiselect?: boolean;
  isMove?: boolean;
  showFoldIcon?: boolean;
  isPadding?: boolean;
  isMoveChildren?: boolean;
  gap?: number;

  fontColor?: string;
  backgroundColor?: string;
  selectedColor?: string;
  borderColor?: string;
  guidelineColor?: string;
  iconColor?: string;

  nameProperty?:
    | (keyof T & string)
    | ((value: T, index: any, scope: any[]) => any);
  idProperty?:
    | (keyof T & string)
    | ((value: T, index: any, scope: any[]) => string);
  childrenProperty?: (keyof T & string) | ((value: T, scope: any[]) => any);
  pathProperty?:
    | (keyof T & string)
    | ((id: string, scope: any[], value: T, index: any) => string);

  checkMove?: (prevInfo: FileInfo<T>) => boolean;
  onMove?: (e: OnMove<T>) => any;
  onSelect?: (e: OnSelect) => any;
}
```
* App code
```tsx
import React from "react";
import Folder, { FileProps } from "@scena/react-folder";

interface Info {
  name: string;
  children: Info[];
}
function FileComponent(props: FileProps<Info>) {
  return (
    <div
      style={{
        padding: "10px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {props.name}
    </div>
  );
}
function App() {
  const [infos, setInfos] = React.useState<Info[]>([
    { name: "hi", children: [{ name: "sub hi", children: [] }] },
    { name: "hi2", children: [{ name: "sub hi2", children: [] }] },
  ]);
  const [selected, setSelected] = React.useState<any[]>([]);
  return (
    <div className="App">
      <Folder<Info>
        infos={infos}
        FileComponent={FileComponent}
        nameProperty="name"
        childrenProperty="children"
        selectedColor={"#4fa"}
        selected={selected}
        multiselect={true}
        isPadding={true}
        isMove={true}
        idProperty={"name"}
        pathProperty={"name"}
        onMove={e => {
          e.selectedInfos.forEach(info => {
            const parentInfo = info.parentInfo;
            const children = parentInfo ? parentInfo.children : infos;

            children.splice(children.indexOf(info.info), 1);
          });
          if (e.parentInfo) {
            e.parentInfo.info.children = e.children;
            setInfos([...infos]);
          } else {
            setInfos([...e.children]);
          }
        }}
        onSelect={e => {
          console.log(e);
          setSelected(e.selected);
        }}
      />
    </div>
  );
}

export default App;


```



## ⚙️ Developments
### `npm run start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.



## ⭐️ Show Your Support
Please give a ⭐️ if this project helped you!

## 👏 Contributing

If you have any questions or requests or want to contribute to `@scena/react-folder` or other packages, please write the [issue](https://github.com/daybrush/react-folder/issues) or give me a Pull Request freely.

## 🐞 Bug Report

If you find a bug, please report to us opening a new [Issue](https://github.com/daybrush/react-folder/issues) on GitHub.


## 📝 License

This project is [MIT](https://github.com/daybrush/react-folder/blob/master/LICENSE) licensed.

```
MIT License

Copyright (c) 2021 Daybrush

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
