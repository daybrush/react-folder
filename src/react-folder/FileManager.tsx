import * as React from "react";
import Folder from "./Folder";
import { FileManagerProps } from "./types";
import { getChildren, getId, getName, getPath, prefix } from "./utils";

export default class FileManager<T = {}> extends React.PureComponent<
  FileManagerProps<T>
> {
  public static defaultProps = {};
  state = {
    fold: false,
  };
  render() {
    const {
      childrenProperty,
      pathProperty,
      nameProperty,
      idProperty,
      index,
      info,
      scope,
      FileComponent,
      isPadding,
      showFoldIcon = true,
      gap,
      multiselect,
      selected,
      originalInfos,
    } = this.props;
    const id = getId(idProperty, info, index, scope);
    const name = getName(nameProperty, info, index, scope);
    const children = getChildren(childrenProperty, info, scope);
    const path = getPath!(pathProperty, id, scope, info, index);
    const nextScope = [...scope, id];
    const length = scope.length;
    const isFolder = children && children.length > 0;

    return (
      <div className={prefix("property")}>
        <div
          className={prefix("file", this.isSelected(path) ? "selected" : "")}
          data-file-path={path}
          style={{
            [isPadding ? "paddingLeft" : "marginLeft"]: `${gap! * length}px`,
            width: isPadding ? "100%" : `calc(100% - ${gap! * length}px)`,
          }}
        >
          {isFolder && showFoldIcon && (
            <div
              className={prefix("fold-icon", this.state.fold ? "fold" : "")}
              onClick={this.onClickFold}
            ></div>
          )}
          <div className={prefix("file-name")}>
            <FileComponent<T>
              scope={scope}
              name={name}
              info={info}
              path={path}
            />
          </div>
        </div>
        {isFolder && !this.state.fold && (
          <Folder<T>
            scope={nextScope}
            infos={children}
            FileComponent={FileComponent}
            nameProperty={nameProperty}
            idProperty={idProperty}
            pathProperty={pathProperty}
            childrenProperty={childrenProperty}
            showFoldIcon={showFoldIcon}
            selected={selected}
            isPadding={isPadding}
            gap={gap}
            multiselect={multiselect}
            originalInfos={originalInfos}
          />
        )}
      </div>
    );
  }
  public isSelected(key: string) {
    const selected = this.props.selected;

    return selected && selected.indexOf(key) > -1;
  }
  public toggleFold() {
    this.setState({
      fold: !this.state.fold,
    });
  }
  public fold() {
    this.setState({
      fold: true,
    });
  }
  public unfold() {
    this.setState({
      fold: false,
    });
  }
  private onClickFold = (e: any) => {
    e.stopPropagation();

    this.toggleFold();
  };
}
