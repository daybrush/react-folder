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
