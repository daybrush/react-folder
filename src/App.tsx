import React from "react";
import "./App.css";
import Folder, { FileProps } from "./react-folder";

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
    { name: "hi", children: [
      { name: "sub hi 1-1", children: [] },
      { name: "sub hi 1-2", children: [] },
      { name: "sub hi 1-3", children: [] }
    ] },
    { name: "hi2", children: [{ name: "sub hi2", children: [] }] },
  ]);
  const [selected, setSelected] = React.useState<any[]>([]);
  const [folded, setFolded] = React.useState<any[]>([]);
  return (
    <div className="App">
      <Folder<Info>
        ref={e => {
          e && ((window as any).a = e);
        }}
        infos={infos}
        FileComponent={FileComponent}
        nameProperty="name"
        childrenProperty="children"
        selectedColor={"#4fa"}
        selected={selected}
        folded={folded}
        multiselect={true}
        isPadding={true}
        isMove={true}
        isMoveChildren={true}
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
        onFold={e => {
          console.log(e);
          setFolded(e.folded);
        }}
      />
    </div>
  );
}

export default App;
