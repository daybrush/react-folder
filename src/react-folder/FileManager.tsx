import * as React from "react";
import Folder from "./Folder";
import { FileManagerProps } from "./types";
import { getChildren, getId, getName, getPath, prefix } from "./utils";

export default class FileManager<T = {}> extends React.PureComponent<
  FileManagerProps<T>
  > {
  public static defaultProps = {};
  public folderRef = React.createRef<Folder>();
  public state = {
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
    const gapWidth = gap! * (length + 1);
    return (
      <div className={prefix("property")}>
        <div
          className={prefix("file", this.isSelected(path) ? "selected" : "")}
          data-file-path={path}
          style={{
            [isPadding ? "paddingLeft" : "marginLeft"]: `${gapWidth}px`,
            width: isPadding ? "100%" : `calc(100% - ${gapWidth}px)`,
          }}
        >
          <div className={prefix("file-name")}>
            {isFolder && showFoldIcon && (
              <div
                className={prefix("fold-icon", this.state.fold ? "fold" : "")}
                onClick={this.onClickFold}
              ></div>
            )}
            <FileComponent<T>
              scope={scope}
              name={name}
              info={info}
              path={path}
            />
          </div>
        </div>
        {isFolder && (
          <Folder<T>
            ref={this.folderRef}
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
            isChild={true}
            display={this.state.fold ? "none" : "block"}
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
  public isFold() {
    return this.state.fold;
  }
  public findFile(targetPath: string): FileManager<T> | null {
    const {
      childrenProperty,
      pathProperty,
      idProperty,
      index,
      info,
      scope,
    } = this.props;
    const id = getId(idProperty, info, index, scope);
    const children = getChildren(childrenProperty, info, scope);
    const path = getPath!(pathProperty, id, scope, info, index);

    if (targetPath === path) {
      return this;
    }
    const childFolder = this.folderRef.current;

    if (!children || !children.length || !childFolder) {
      return null;
    }

    return childFolder.findFile(targetPath);
  }
  private onClickFold = (e: any) => {
    e.stopPropagation();

    this.toggleFold();
  };
}
