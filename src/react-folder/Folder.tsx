import * as React from "react";
import {
  getChildren,
  getId,
  getName,
  getPath,
  isEqualArray,
  prefix,
} from "./utils";
import { IObject, findIndex, hasClass, between, find } from "@daybrush/utils";
import KeyController from "keycon";
import Gesto, { OnDrag, OnDragStart, OnDragEnd } from "gesto";
import styled, { StyledElement } from "react-css-styled";
import { FileInfo, FolderProps, FolderState } from "./types";
import { prefixCSS, ref } from "framework-utils";
import { PREFIX } from "./consts";
import FileManager from "./FileManager";

const FolderElement = styled(
  "div",
  prefixCSS(
    PREFIX,
    `
{
  position: relative;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  --folder-selected-color: #5bf;
  --folder-border-color: #444;
  --folder-guideline-color: #4af;
  --folder-background-color: #2a2a2a;
  --folder-icon-color: #fff;
  --folder-font-color: #fff;
  background: var(--folder-background-color);
}
:host :host {
  --folder-selected-color: inherit;
  --folder-border-color: inherit;
  --folder-guideline-color: inherit;
  --folder-background-color: inherit;
  --folder-icon-color: inherit;
  --folder-font-color: inherit;
}
.fold-icon {
  position: relative;
  display: inline-block;
  vertical-align: middle;
  width: 20px;
  height: 20px;
}
.fold-icon:before {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-top: 4px solid var(--folder-icon-color);
  border-left: 3px solid transparent;
  border-right: 3px solid transparent;
}
.fold-icon.fold:before {
  border-right: 0;
  border-left: 4px solid var(--folder-icon-color);
  border-top: 3px solid transparent;
  border-bottom: 3px solid transparent;
}
.file {
  position: relative;
  box-sizing: border-box;
  padding: 2px;
  border-bottom: 1px solid var(--folder-border-color);
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  color: var(--folder-font-color);
}
.file .file-name {
  display: inline-block;
  flex: 1;
}
.shadows {
  position: absolute;
  pointer-events: none;
  transition: translateY(-50%);
  opacity: 0.5;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 10;
  display: none;
}
.file.selected {
  background: var(--folder-selected-color);
}
.guideline {
  position: absolute;
  width: 100%;
  height: 4px;
  background: var(--folder-guideline-color);
  transform: translateY(-50%);
  display: none;
}
`
  )
);

function getCurrentFile(target: HTMLElement) {
  while (target) {
    if (target.hasAttribute("data-file-path")) {
      break;
    }
    target = target.parentElement as HTMLElement;
  }
  return target;
}
export default class Folder<T = any> extends React.PureComponent<
  FolderProps<T>,
  FolderState<T>
> {
  public static defaultProps = {
    scope: [],
    name: "",
    selected: [],
    onMove: () => {},
    checkMove: () => true,
    onSelect: () => {},
    gap: 20,

    pathProperty: (id: string, scope: string[]) => [...scope, id].join("///"),
    idProperty: (_: any, index: number) => index,
    nameProperty: (_: any, index: number) => index,
    childrenProperty: () => [],
  };
  public moveGesto!: Gesto;
  public folderRef = React.createRef<StyledElement<HTMLDivElement>>();
  public shadowRef = React.createRef<HTMLDivElement>();
  public guidelineElement!: HTMLElement;
  public state: FolderState<T> = {
    fold: false,
    shadows: [],
  };
  public isSelected(key: string) {
    const selected = this.props.selected;

    return selected && selected.indexOf(key) > -1;
  }
  public render() {
    const {
      scope,
      gap = 10,
      isPadding,
      infos,
      selected,
      multiselect,
      FileComponent,
      nameProperty,
      idProperty,
      pathProperty,
      childrenProperty,
      showFoldIcon,
      iconColor,
      fontColor,
      backgroundColor,
      borderColor,
      guidelineColor,
      selectedColor,
      originalInfos,
    } = this.props;

    return (
      <FolderElement
        className={prefix("folder")}
        ref={this.folderRef}
        style={{
          "--folder-icon-color": iconColor,
          "--folder-background-color": backgroundColor,
          "--folder-border-color": borderColor,
          "--folder-guideline-color": guidelineColor,
          "--folder-selected-color": selectedColor,
          "--folder-font-color": fontColor,
        }}
      >
        {infos.map((info, index) => {
          return (
            <FileManager<T>
              key={index}
              index={index}
              info={info}
              scope={scope!}
              selected={selected!}
              FileComponent={FileComponent}
              isPadding={isPadding}
              gap={gap}
              multiselect={multiselect}
              showFoldIcon={showFoldIcon}
              nameProperty={nameProperty}
              idProperty={idProperty}
              childrenProperty={childrenProperty}
              pathProperty={pathProperty}
              originalInfos={originalInfos || infos}
            ></FileManager>
          );
        })}
        <div
          className={prefix("guideline")}
          ref={ref(this, "guidelineElement")}
        ></div>
        {this.renderShadows()}
      </FolderElement>
    );
  }
  public componentDidMount() {
    KeyController.setGlobal();
    if (this.props.isMove) {
      const folderElement = this.folderRef.current!.getElement();
      this.moveGesto = new Gesto(folderElement, {
        container: window,
        checkInput: true,
      })
        .on("dragStart", this.onDragStart)
        .on("drag", this.onDrag)
        .on("dragEnd", this.onDragEnd);
    }
  }
  public componentWillUnmount() {
    if (this.moveGesto) {
      this.moveGesto.unset();
    }
  }
  private renderShadows() {
    const { FileComponent, nameProperty, scope } = this.props;
    if (scope!.length) {
      return;
    }
    return (
      <div className={prefix("shadows")} ref={this.shadowRef}>
        {this.state.shadows.map((info) => {
          const {
            scope: fileScope,
            info: infoValue,
            path,
            scope,
            index,
          } = info;
          const name = getName(nameProperty, infoValue, index, scope);
          return (
            <div key={path} className={prefix("file", "selected", "shadow")}>
              <FileComponent<T>
                scope={fileScope}
                name={name}
                info={infoValue}
                path={path}
              />
            </div>
          );
        })}
      </div>
    );
  }
  private onDragStart = (e: OnDragStart) => {
    if (hasClass(e.inputEvent.target, prefix("fold-icon"))) {
      e.stop();
      return false;
    }
    const folderElement = this.folderRef.current!.getElement();
    const rect = folderElement.getBoundingClientRect();
    const datas = e.datas;
    const offsetX = e.clientX - rect.left;
    // const offsetY = e.clientY - rect.top;

    datas.offsetX = offsetX;
    datas.folderRect = rect;
    datas.folderLine = rect.left + rect.width - 10;

    e.inputEvent.preventDefault();
    e.inputEvent.stopPropagation();

    const fileInfos = this.flatChildren();

    datas.fileMap = this.flatMap(fileInfos);
    datas.fileInfos = fileInfos;

    const clickedFile: HTMLElement = getCurrentFile(e.inputEvent.target);
    const selected = this.props.selected!;

    if (
      clickedFile &&
      selected.indexOf(clickedFile.getAttribute("data-file-path")!) === -1
    ) {
      datas.clickedFile = clickedFile;
      this.onClickFile({ currentTarget: clickedFile });
      return;
    }
  };

  private onDrag = (e: OnDrag) => {
    const folderElement = this.folderRef.current!.getElement();
    const { clientX, clientY, datas } = e;

    datas.isTop = false;
    datas.depth = 0;
    datas.targetInfo = null;
    datas.prevInfo = null;
    datas.nextInfo = null;

    const selected = this.props.selected!;

    this.clearGuideline();
    if (!selected || !selected.length) {
      return;
    }
    const fileInfos: Array<FileInfo<T>> = datas.fileInfos;
    const fileMap: IObject<FileInfo<T>> = datas.fileMap;
    const folderRect: DOMRect = datas.folderRect;
    const selectedInfos: Array<FileInfo<T>> = selected.map((id) => fileMap[id]);

    // set shadows
    if (!this.state.shadows.length) {
      this.setState(
        {
          shadows: selectedInfos,
        },
        () => {
          // datas.offsetY = 0;
          this.updateShadowPosition(folderRect, e);
        }
      );
      return;
    } else {
      this.updateShadowPosition(folderRect, e);
    }
    let targetElement = getCurrentFile(
      document.elementFromPoint(datas.folderLine, e.clientY) as HTMLElement
    );

    if (!targetElement) {
      return;
    }
    let tarpathProperty = targetElement.getAttribute("data-file-path")!;
    let targetRect = targetElement.getBoundingClientRect();
    let isTop = targetRect.top + targetRect.height / 2 > clientY;
    let targetIndex = findIndex(
      fileInfos,
      (info) => info.path === tarpathProperty
    );
    let targetInfo = fileInfos[targetIndex];
    let prevInfo = fileInfos[targetIndex - 1];

    if (prevInfo && isTop) {
      --targetIndex;
      targetInfo = prevInfo;
      prevInfo = fileInfos[targetIndex - 1];
      tarpathProperty = targetInfo.path;
      targetElement = folderElement.querySelector<HTMLElement>(
        `[data-file-path="${tarpathProperty}"]`
      )!;

      if (!targetElement) {
        return;
      }
      targetRect = targetElement.getBoundingClientRect();
      isTop = false;
    }
    const { isMoveChildren, checkMove, gap } = this.props;
    const nextInfo = fileInfos[targetIndex + 1];
    // const prevDepth = prevInfo ? prevInfo.depth : 0;
    const targetDepth = targetInfo.depth;
    const nextDepth = nextInfo ? nextInfo.depth : 0;
    const distX = clientX - folderRect.left - targetDepth * gap!;

    // target = next => same children
    // target < next => next is children
    // target > next => next is other parent
    const childrenDepth = this.getNextChildrenDepth(nextInfo);
    const depthRange = [
      targetDepth <= nextDepth
        ? nextDepth - targetDepth
        : childrenDepth - targetDepth,
      Math.max(targetDepth + 1, nextDepth) - targetDepth,
    ];

    if (
      targetDepth <= nextDepth &&
      nextInfo &&
      selected.indexOf(nextInfo.path) > -1
    ) {
      depthRange[0] += Math.min(0, childrenDepth - nextDepth);
    }

    let distDepth = isTop
      ? 0
      : between(
          Math.round((distX > 0 ? distX * 0.2 : distX - gap! / 10) / gap!),
          depthRange[0],
          depthRange[1]
        );
    if (
      nextInfo &&
      !isTop &&
      selected.indexOf(nextInfo.path) > -1 &&
      targetDepth + distDepth === nextDepth
    ) {
      return;
    }
    if (this.contains(selected, tarpathProperty, fileMap)) {
      return;
    }
    if (selected.indexOf(tarpathProperty) > -1 && distDepth >= 0) {
      return;
    }

    if (isMoveChildren) {
      const parentPath = targetInfo.parentPath;

      if (selectedInfos.every((info) => info.parentPath === parentPath)) {
        // same parent path
        distDepth = 0;
      } else if (
        // target >> selected
        selectedInfos.every((info) => info.parentPath === tarpathProperty)
      ) {
        distDepth = 1;
      } else {
        return;
      }
    } else if (distDepth > 0 && !checkMove!(targetInfo)) {
      distDepth = 0;
    }
    const guidelineX = (targetDepth + distDepth) * gap!;
    const guidelineY =
      targetRect.top - folderRect.top + (isTop ? 0 : targetRect.height);
    this.guidelineElement.style.cssText = `display: block;top: ${guidelineY}px;left: ${guidelineX}px; width: calc(100% - ${guidelineX}px);`;

    datas.depth = distDepth;
    datas.isTop = isTop;
    datas.targetInfo = targetInfo;
    datas.prevInfo = prevInfo;
    datas.nextInfo = nextInfo;
  };
  private onDragEnd = (e: OnDragEnd) => {
    this.clearGuideline();
    const datas = e.datas;

    if (!e.isDrag && !datas.clickedFile) {
      const currentTarget = getCurrentFile(e.inputEvent.target);

      if (currentTarget) {
        this.onClickFile({ currentTarget });
      }
      return;
    }
    const targetInfo: FileInfo<T> = datas.targetInfo;
    const depth = datas.depth;
    const isTop = datas.isTop;
    const fileMap = datas.fileMap;

    if (targetInfo) {
      const { onMove, selected } = this.props;
      const selectedInfos: Array<FileInfo<T>> = (selected || []).map(
        (id) => fileMap[id]
      );

      let prevInfo: FileInfo<T> | undefined;
      let parentInfo: FileInfo<T> | undefined;

      if (!isTop) {
        prevInfo = targetInfo;

        if (depth <= 0) {
          const length = Math.abs(depth);

          for (let i = 0; i < length; ++i) {
            prevInfo = fileMap[prevInfo!.parentPath];
          }
          parentInfo = fileMap[prevInfo!.parentPath];
        } else {
          parentInfo = prevInfo;
          prevInfo = undefined;
        }
      }

      let childrenInfos = this.getChildrenFileInfos(parentInfo).filter(
        (info) =>
          !find(
            selectedInfos,
            (selectedInfo) => selectedInfo.path === info.path
          )
      );

      if (prevInfo) {
        const prevIndex = findIndex(
          childrenInfos,
          (info) => info.path === prevInfo!.path
        );

        if (prevIndex > -1) {
          childrenInfos.splice(prevIndex + 1, 0, ...selectedInfos);
        }
      } else {
        childrenInfos = [...selectedInfos, ...childrenInfos];
      }

      const children = childrenInfos.map((info) => info.info);

      if ((!parentInfo && isTop) || parentInfo || prevInfo) {
        onMove!({
          children,
          childrenInfos,
          selectedInfos,
          parentInfo: parentInfo || null,
          prevInfo: prevInfo || null,
        });
      }
    }

    this.setState(
      {
        shadows: [],
      },
      () => {
        this.shadowRef.current!.style.cssText = "display: none";
      }
    );
  };
  private updateShadowPosition(rect: ClientRect, e: OnDragStart | OnDrag) {
    const el = this.shadowRef.current;

    if (!el || !this.state.shadows.length) {
      return;
    }
    const datas = e.datas;
    el.style.cssText = `display: block; transform: translate(${
      e.clientX - rect.left - datas.offsetX
    }px, ${e.clientY - rect.top}px) translateY(-50%)`;
  }
  private onClickFile = ({ currentTarget }: any) => {
    const path = currentTarget.getAttribute("data-file-path")!;
    const { multiselect, onSelect, selected } = this.props;

    let nextSelected: string[];
    if (multiselect) {
      nextSelected = (selected || []).slice();
      const index = nextSelected.indexOf(path);

      if (KeyController.global.shiftKey) {
        if (index > -1) {
          nextSelected.splice(index, 1);
        } else {
          nextSelected.push(path);
        }
      } else {
        nextSelected = [path];
      }
    } else {
      nextSelected = [path];
    }
    nextSelected = this.flatChildren()
      .map((info) => info.path)
      .filter((flatPath) => nextSelected.indexOf(flatPath) > -1);

    if (!isEqualArray(selected!, nextSelected)) {
      onSelect!({
        selected: nextSelected,
      });
    }
  };
  private getNextChildrenDepth(targetInfo?: FileInfo<T>): number {
    if (!targetInfo) {
      return 0;
    }
    const childrenProperty = this.props.childrenProperty;
    const parentFileInfo = targetInfo.parentFileInfo;

    if (parentFileInfo) {
      const children = getChildren(
        childrenProperty,
        parentFileInfo.info,
        parentFileInfo.scope
      );

      if (children && children.length === targetInfo.index + 1) {
        return this.getNextChildrenDepth(parentFileInfo);
      }
    }
    return targetInfo.depth;
  }
  private contains(
    paths: string[],
    path: string,
    fileMap = this.flatMap()
  ): boolean {
    const info = fileMap[path];
    const parentPath = info.parentPath;

    if (!parentPath) {
      return false;
    }
    if (paths.indexOf(parentPath) > -1) {
      return true;
    }
    return this.contains(paths, parentPath, fileMap);
  }
  private flatMap(children = this.flatChildren()) {
    const objMap: IObject<FileInfo<T>> = {};
    children.forEach((info) => {
      objMap[info.path] = info;
    });

    return objMap;
  }
  private getChildrenFileInfos(parentInfo?: FileInfo<T>): Array<FileInfo<T>> {
    const { childrenProperty, idProperty, pathProperty, infos } = this.props;

    let scope: string[] = [];
    let children: T[] = infos;
    let parentPath: string = "";

    if (parentInfo) {
      scope = [...parentInfo.scope, parentInfo.id];
      children = getChildren(childrenProperty, parentInfo.info, scope);
      parentPath = parentInfo.path;
    }

    if (children) {
      return children.map((info, index) => {
        const id = getId(idProperty, info, index, scope);
        const path = getPath!(pathProperty, id, scope, info, index);
        const depth = scope.length;

        return {
          id,
          path,
          parentInfo: parentInfo ? parentInfo.info : null,
          parentFileInfo: parentInfo || null,
          parentPath,
          depth,
          scope,
          info,
          index,
        };
      });
    }

    return [];
  }
  private flatChildren() {
    const { pathProperty, idProperty, childrenProperty, infos } = this.props;
    const children: Array<FileInfo<T>> = [];

    function push(
      parentFileInfo: FileInfo<T> | null,
      parentPath: string,
      info: T,
      index: number,
      scope: string[]
    ) {
      const id = getId(idProperty, info, index, scope);
      const path = getPath!(pathProperty, id, scope, info, index);
      const depth = scope.length;

      const fileInfo = {
        id,
        path,
        parentInfo: parentFileInfo ? parentFileInfo.info : null,
        parentFileInfo,
        parentPath,
        depth,
        scope,
        info,
        index,
      };

      children.push(fileInfo);
      const nextScope = [...scope, id];
      const nextChildren = getChildren(childrenProperty, info, scope);

      if (nextChildren) {
        nextChildren.forEach((nextInfo, nextIndex) => {
          push(fileInfo, path, nextInfo, nextIndex, nextScope);
        });
      }
    }
    infos.forEach((info, index) => {
      push(null, "", info, index, []);
    });

    return children;
  }
  private clearGuideline() {
    this.guidelineElement.style.display = "none";
  }
}
