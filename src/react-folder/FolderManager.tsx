/* eslint-disable prefer-const */
import * as React from "react";
import {
    getChildren,
    getId,
    getName,
    getPath,
    isArrayContains,
    isEqualArray,
    prefix,
} from "./utils";
import { IObject, findIndex, hasClass, between, find, isString } from "@daybrush/utils";
import KeyController from "keycon";
import Gesto, { OnDrag, OnDragStart, OnDragEnd } from "gesto";
import styled, { StyledElement } from "react-css-styled";
import { FileInfo, FolderProps, FolderState, MoveInfo } from "./types";
import { prefixCSS, ref, refs } from "framework-utils";
import { PREFIX, RootFolderContext } from "./consts";
import FileManager from "./FileManager";
import { DefaultFoldIcon } from "./DefaultFoldIcon";


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
.default-fold-icon {
  position: absolute;
  display: inline-block;
  vertical-align: middle;
  width: 15px;
  height: 20px;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
}
.default-fold-icon:before {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-top: 4px solid var(--folder-icon-color);
  border-left: 3px solid transparent;
  border-right: 3px solid transparent;
}
.default-fold-icon.fold:before {
  border-right: 0;
  border-left: 4px solid var(--folder-icon-color);
  border-top: 3px solid transparent;
  border-bottom: 3px solid transparent;
}
.file {
  position: relative;
  box-sizing: border-box;
  border-bottom: 1px solid var(--folder-border-color);
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  color: var(--folder-font-color);
}
.file .file-name {
  position: relative;
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

export default class FolderManager<T extends {} = any>
    extends React.PureComponent<FolderProps<T>, FolderState<T>> {
    public static defaultProps: Partial<FolderProps<{}>> = {
        scope: [],
        selected: [],
        folded: [],
        onMove: () => { },
        checkMove: () => true,
        onSelect: () => { },
        gap: 15,
        gapOffset: 0,
        urlProperty: (id: string) => id,
        pathProperty: (id: string, scope: string[]) => [...scope, id],
        idProperty: (_: any, index: number) => index,
        nameProperty: (_: any, index: number) => index,
        childrenProperty: () => [],
        passWrapperProps: () => ({}),
        pathSeperator: "///",
        FoldIcon: DefaultFoldIcon,
    };
    public moveGesto!: Gesto;
    public folderRef = React.createRef<StyledElement<HTMLDivElement>>();
    public shadowRef = React.createRef<HTMLDivElement>();
    public guidelineElement!: HTMLElement;
    public state: FolderState<T> = {
        shadows: [],
    };
    private fileManagers: Array<FileManager<T>> = [];
    public render() {
        const rendered = this._renderFiles();

        if (!this.props.scope!.length) {
            return <RootFolderContext.Provider value={this}>
                {rendered}
            </RootFolderContext.Provider>;
        } else {
            return rendered;
        }
    }
    public componentDidMount() {
        KeyController.setGlobal();
        if (!this.props.isChild) {
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
        this.moveGesto?.unset();
    }
    public isSelected(path: string) {
        const selected = this.props.selected;

        return selected && selected.indexOf(path) > -1;
    }
    public isFolded(path: string) {
        const folded = this.props.folded;

        return folded && folded.indexOf(path) > -1;
    }
    public findFileInfo(targetPath: string | string[]): FileInfo<T> | null {
        const targetPathUrl = isString(targetPath) ? targetPath : targetPath.join(this.props.pathSeperator!);
        const children = this.flatChildren();

        return find(children, child => {
            return child.pathUrl === targetPathUrl;
        }) || null;
    }
    public findFile(targetPath: string | string[]): FileManager<T> | null {
        const fileManagers = this.fileManagers;
        const length = fileManagers.length;
        const targetPathUrl = isString(targetPath) ? targetPath : targetPath.join(this.props.pathSeperator!);

        for (let i = 0; i < length; ++i) {
            const file = fileManagers[i].findFile(targetPathUrl);

            if (file) {
                return file;
            }
        }
        return null;
    }
    private renderShadows() {
        const {
            FileComponent,
            nameProperty,
            scope, isPadding, gap,
            passWrapperProps,
            gapOffset,
        } = this.props;
        if (scope!.length) {
            return;
        }
        return (
            <div className={prefix("shadows")} ref={this.shadowRef}>
                {this.state.shadows.map((info) => {
                    const {
                        scope: fileScope,
                        value: infoValue,
                        pathUrl,
                        path,
                        scope,
                        index,
                    } = info;
                    const name = getName(nameProperty, infoValue, index, scope);
                    const gapWidth = gap! * (scope.length + 1) + gapOffset!;
                    const className = prefix("file", "selected", "shadow");
                    let style = {
                        [isPadding ? "paddingLeft" : "marginLeft"]: `${gapWidth}px`,
                        width: isPadding ? "100%" : `calc(100% - ${gapWidth}px)`,
                    };
                    const {
                        style: passedStyle,
                        ...otherProps
                    } = passWrapperProps!({
                        className,
                        style,
                        scope,
                        name,
                        value: infoValue,
                        path,
                        gapWidth,
                        isSelected: true,
                        isShadow: true,
                    }) || {};

                    if (passedStyle) {
                        style = {
                            ...style,
                            ...passedStyle,
                        };
                    }

                    return (
                        <div key={pathUrl} className={className} style={passedStyle} {...otherProps}>
                            <FileComponent<T>
                                scope={fileScope}
                                name={name}
                                value={infoValue}
                                path={path}
                            />
                        </div>
                    );
                })}
            </div>
        );
    }
    private onDragStart = (e: OnDragStart) => {
        const clickedFile: HTMLElement = getCurrentFile(e.inputEvent.target);
        const datas = e.datas;

        if (hasClass(e.inputEvent.target, prefix("fold-icon"))) {
            e.stop();
            this.onClickFold(clickedFile);
            return false;
        }
        const fileInfos = this.flatChildren();

        datas.fileMap = this.flatMap(fileInfos);
        datas.fileInfos = fileInfos;


        const folderElement = this.folderRef.current!.getElement();

        if (!this.props.isMove) {
            if (clickedFile) {
                this.onClickFile({ currentTarget: clickedFile, datas });
            }
            e.stop();
            return false;
        }
        const dragCondtion = this.props.dragCondtion || (() => true);

        if (!dragCondtion(e)) {
            e.stop();
            return false;
        }
        const rect = folderElement.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        // const offsetY = e.clientY - rect.top;

        datas.offsetX = offsetX;
        datas.folderRect = rect;
        datas.folderLine = rect.left + rect.width - 10;

        e.inputEvent.preventDefault();
        e.inputEvent.stopPropagation();


        const selected = this.props.selected!;

        if (
            clickedFile &&
            selected.indexOf(clickedFile.getAttribute("data-file-path")!) === -1
        ) {
            datas.clickedFile = clickedFile;
            this.onClickFile({ currentTarget: clickedFile, datas });
            return;
        }
    };

    private onDrag = (e: OnDrag) => {
        const { clientX, clientY, datas } = e;

        datas.isTop = false;
        datas.depth = 0;
        datas.targetInfo = null;
        datas.prevInfo = null;
        datas.nextInfo = null;

        const {
            selected,
            checkMove,
            gap,
            pathSeperator,
        } = this.props;

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
        let targetPathUrl = targetElement.getAttribute("data-file-path")!;
        let targetRect = targetElement.getBoundingClientRect();
        let isTop = targetRect.top + targetRect.height / 2 > clientY;

        let targetIndex = findIndex(
            fileInfos,
            (info) => info.pathUrl === targetPathUrl
        );
        const targetInfo = fileInfos[targetIndex];

        const targetDepth = targetInfo.depth;
        const distX = clientX - folderRect.left - (targetDepth + 1) * gap!;

        let depthRange = [0, 0];
        let moveInfos: Array<MoveInfo<T>> = [];

        const prevInfo = fileInfos[isTop ? targetIndex - 1 : targetIndex];
        const nextInfo = fileInfos[isTop ? targetIndex : targetIndex + 1];
        const prevPath = prevInfo?.path ?? [];
        const prevDepth = prevInfo?.depth ?? 0;
        const nextDepth = nextInfo?.depth ?? 0;

        if (!nextInfo && !isTop) {
            // last
            depthRange = [0, targetDepth + 1];

            for (let depth = depthRange[0]; depth <= depthRange[1]; ++depth) {
                const movePath = prevPath.slice(0, depth);
                const movePathUrl = movePath.join(pathSeperator);
                const children = fileInfos.filter(info => {
                    return info.parentPathUrl === movePathUrl;
                });

                moveInfos.push({
                    depth,
                    parentInfo: fileMap[movePathUrl],
                    prevInfo: children[children.length - 1],
                });
            }
        } else if (!prevInfo && isTop) {
            // first
            depthRange = [0, 0];
            moveInfos.push({
                depth: 0,
            });
        } else {
            if (prevDepth === nextDepth) {
                // same children or append group
                depthRange = [
                    prevDepth,
                    prevDepth + 1,
                ];
                // same children
                moveInfos.push({
                    depth: nextDepth,
                    prevInfo,
                    parentInfo: prevInfo.parentFileInfo,
                });
                // append group
                moveInfos.push({
                    depth: nextDepth + 1,
                    parentInfo: prevInfo,
                });


            } else if (prevDepth < nextDepth) {
                depthRange = [
                    nextDepth,
                    nextDepth,
                ];
                // parent(prev) => target
                moveInfos.push({
                    depth: nextDepth,
                    parentInfo: prevInfo,
                });
            } else if (prevDepth > nextDepth) {
                const prevPath = prevInfo.path;
                // last child(prev) => next other group or target
                depthRange = [
                    nextDepth,
                    prevDepth + 1,
                ];
                for (let depth = depthRange[0]; depth <= depthRange[1]; ++depth) {
                    const movePath = prevPath.slice(0, depth + 1);
                    const movePathUrl = movePath.join(pathSeperator);
                    const parentPathUrl = prevPath.slice(0, depth).join(pathSeperator);
                    const prevFileInfo = fileInfos.find(info => {
                        return info.pathUrl === movePathUrl;
                    });

                    moveInfos.push({
                        depth,
                        parentInfo: fileMap[parentPathUrl],
                        prevInfo: depth > prevDepth ? null : prevFileInfo,
                    });
                }
            }
        }
        const selectedPaths = selected.map(selectedUrl => selectedUrl.split(pathSeperator!));

        moveInfos = moveInfos.filter(({ prevInfo, parentInfo }) => {
            const info = prevInfo || parentInfo;
            const movePath = info?.path ?? [];

            return !selectedPaths.some((path, i) => {
                // 자기 자신 옆에 있는 경우
                if (prevInfo?.pathUrl === selected[i]) {
                    return false;
                }
                // 상위 그룹 또는 자기 자신에 포함되려고 하는 경우
                return path.every((id, i) => id === movePath[i]);
            });
        });


        if (!moveInfos.length) {
            return;
        }

        const guidelineDepth = between(
            targetDepth + Math.round((distX > 0 ? distX * 0.2 : distX - gap! / 10) / gap!),
            depthRange[0],
            depthRange[1],
        );

        const passedInfos = moveInfos.filter(info => {
            return checkMove!(info);
        }).sort((a, b) => {
            return Math.abs(a.depth - guidelineDepth) - Math.abs(b.depth - guidelineDepth);
        });
        const moveInfo = passedInfos[0];

        if (!moveInfo) {
            return;
        }

        const passedDepth = moveInfo.depth;
        const guidelineX = passedDepth ? (passedDepth + 1) * gap! : 0;
        const guidelineY =
            targetRect.top - folderRect.top + (isTop ? 0 : targetRect.height);
        this.guidelineElement.style.cssText
            = `display: block;`
            + `top: ${guidelineY}px;`
            + `left: ${guidelineX}px;`
            + `width: calc(100% - ${guidelineX}px);`;

        datas.moveInfo = moveInfo;
        datas.isTop = isTop;
        datas.guidelineDepth = passedDepth;
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
                this.onClickFile({ currentTarget, datas });
            }
            return;
        }
        const { onMove, selected, pathSeperator, folded } = this.props;
        const fileInfos: Array<FileInfo<T>> = datas.fileInfos;
        const targetInfo: FileInfo<T> = datas.targetInfo;
        const moveInfo: MoveInfo<T> = datas.moveInfo;
        const fileMap: Record<string, FileInfo<T>> = datas.fileMap;
        const selectedInfos: Array<FileInfo<T>> = selected!.map(id => fileMap[id]);

        if (targetInfo) {
            let prevInfo = moveInfo.prevInfo;
            let childrenInfos = this.getChildrenFileInfos(moveInfo.parentInfo);

            if (prevInfo) {
                const prevPathUrl = prevInfo.pathUrl;
                let index = findIndex(childrenInfos, info => info.pathUrl === prevPathUrl);

                for (; index >= -1; --index) {
                    if (index === -1) {
                        prevInfo = null;
                    } else {
                        prevInfo = childrenInfos[index];
                        if (selected!.every(pathUrl => pathUrl !== prevInfo!.pathUrl)) {
                            break;
                        }
                    }
                }
            }
            let flattenPrevInfo = datas.prevInfo;

            if (flattenPrevInfo) {
                const prevPathUrl = flattenPrevInfo.pathUrl;
                let index = findIndex(fileInfos, info => info.pathUrl === prevPathUrl);

                for (; index >= -1; --index) {
                    if (index === -1) {
                        flattenPrevInfo = null;
                    } else {
                        flattenPrevInfo = fileInfos[index];

                        if (selectedInfos.every(({ path }) => !isArrayContains(path, flattenPrevInfo!.path))) {
                            break;
                        }
                    }
                }
            }

            childrenInfos = childrenInfos.filter(info => {
                // 같은 아이템은 패스
                return !find(selectedInfos, (selectedInfo) => selectedInfo.pathUrl === info.pathUrl);
            });

            childrenInfos.splice(
                prevInfo ? childrenInfos.findIndex(info => info.pathUrl === prevInfo!.pathUrl) + 1 : 0,
                0,
                ...selectedInfos,
            );
            const parentPath = moveInfo.parentInfo?.path ?? [];

            const nextFolded = folded!.map(pathUrl => {
                const fileInfo = fileMap[pathUrl];

                if (selected!.indexOf(pathUrl) === -1) {
                    return pathUrl;
                }

                return [...parentPath, fileInfo.id].join(pathSeperator);
            }).filter(Boolean) as string[];


            onMove!({
                ...moveInfo,
                prevInfo,
                children: childrenInfos.map(info => info.value),
                childrenInfos,
                flattenInfos: fileInfos,
                flattenPrevInfo,
                selected: selected!,
                selectedInfos,
                nextFolded,


            });
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
        el.style.cssText = `display: block;`
            + `transform: translate(${e.clientX - rect.left - datas.offsetX}px, ${e.clientY - rect.top}px) translateY(-50%)`;
    }
    private onClickFile = ({ currentTarget, datas }: any) => {
        const pathUrl = currentTarget.getAttribute("data-file-path")!;
        const {
            multiselect, onSelect,
            selected, pathSeperator,
        } = this.props;

        let isSelected = false;
        let nextSelected: string[];

        if (multiselect) {
            nextSelected = (selected || []).slice();
            const index = nextSelected.indexOf(pathUrl);

            if (KeyController.global.shiftKey) {
                if (index > -1) {
                    nextSelected.splice(index, 1);
                } else {
                    isSelected = true;
                    nextSelected.push(pathUrl);
                }
            } else {
                isSelected = true;
                nextSelected = [pathUrl];
            }
        } else {
            isSelected = true;
            nextSelected = [pathUrl];
        }
        nextSelected = this.flatChildren()
            .map((info) => info.pathUrl)
            .filter((flatPath) => nextSelected.indexOf(flatPath) > -1);

        let selectedPaths = nextSelected.map(pathUrl => pathUrl.split(pathSeperator!));

        selectedPaths = selectedPaths.filter((path, i) => {
            return selectedPaths.every((path2, j) => {
                return i === j || !isArrayContains(path2, path);
            });
        });

        nextSelected = selectedPaths.map(path => path.join(pathSeperator!));

        const fileMap = datas.fileMap;
        const selectedInfos: Array<FileInfo<T>> = nextSelected.map((id) => fileMap[id]);

        if (!isEqualArray(selected!, nextSelected)) {
            onSelect!({
                pathUrl,
                path: pathUrl.split(pathSeperator!),
                isSelected,
                selected: nextSelected,
                selectedInfos,
            });
        }
    };
    private flatMap(children = this.flatChildren()) {
        const objMap: IObject<FileInfo<T>> = {};

        children.forEach((info) => {
            objMap[info.pathUrl] = info;
        });

        return objMap;
    }
    private getChildrenFileInfos(parentInfo?: FileInfo<T> | null | undefined): Array<FileInfo<T>> {
        const { childrenProperty, idProperty, pathProperty, infos, pathSeperator } = this.props;

        let scope: string[] = [];
        let children: T[] = infos;
        let parentPath: string[] = [];
        let parentPathUrl = "";

        if (parentInfo) {
            scope = [...parentInfo.scope, parentInfo.id];
            children = getChildren(childrenProperty, parentInfo.value, scope);
            parentPathUrl = parentInfo.pathUrl;
            parentPath = parentInfo.path;
        }

        if (children) {
            return children.map((value, index) => {
                const id = getId(idProperty, value, index, scope);
                const path = getPath!(pathProperty, id, scope, value, index);
                const depth = scope.length;

                return {
                    id,
                    path,
                    parentPath,
                    parentValue: parentInfo?.value,
                    parentFileInfo: parentInfo || null,
                    pathUrl: path.join(pathSeperator),
                    parentPathUrl,
                    depth,
                    scope,
                    value,
                    index,
                };
            });
        }

        return [];
    }
    private flatChildren() {
        const { pathProperty, idProperty, childrenProperty, infos, folded, pathSeperator } = this.props;
        const children: Array<FileInfo<T>> = [];

        function push(
            parentFileInfo: FileInfo<T> | null,
            parentPathUrl: string,
            value: T,
            index: number,
            scope: string[]
        ) {
            const id = getId(idProperty, value, index, scope);
            const path = getPath!(pathProperty, id, scope, value, index);
            const pathUrl = path.join(pathSeperator);
            const depth = scope.length;

            const fileInfo: FileInfo<T> = {
                id,
                path,
                pathUrl,
                parentValue: parentFileInfo?.value,
                parentFileInfo,
                parentPath: parentPathUrl.split(pathSeperator!),
                parentPathUrl,
                depth,
                scope,
                value,
                index,
            };

            children.push(fileInfo);
            const nextScope = [...scope, id];
            const nextChildren = getChildren(childrenProperty, value, scope);

            if (nextChildren && folded!.indexOf(pathUrl) === -1) {
                nextChildren.forEach((nextInfo, nextIndex) => {
                    push(fileInfo, pathUrl, nextInfo, nextIndex, nextScope);
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
    private onClickFold = (target: HTMLElement) => {
        const {
            folded: propsFolded,
            pathSeperator,
        } = this.props;
        const pathUrl = target.getAttribute("data-file-path")!;

        const folded = [...(propsFolded || [])];
        const onFold = this.props.onFold;
        const index = folded.indexOf(pathUrl);
        const isFolded = index > -1;

        if (isFolded) {
            folded.splice(index, 1);
        } else {
            folded.push(pathUrl);
        }
        onFold && onFold({
            path: pathUrl.split(pathSeperator!),
            pathUrl,
            isFolded: !isFolded,
            folded,
        });
    };
    private _renderFiles() {
        const {
            scope,
            gap,
            gapOffset,
            isPadding,
            infos,
            selected,
            folded,
            multiselect,
            FileComponent,
            FoldIcon,
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
            display,
            pathSeperator,
            passWrapperProps,
        } = this.props;

        this.fileManagers = this.fileManagers.slice(0, infos.length);

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
                    display: display || "block",
                }}
            >
                {infos.map((info, index) => {
                    return (<FileManager<T>
                        ref={refs(this, "fileManagers", index)}
                        key={index}
                        index={index}
                        info={info}
                        scope={scope!}
                        selected={selected!}
                        folded={folded!}
                        FoldIcon={FoldIcon}
                        FileComponent={FileComponent}
                        isPadding={isPadding}
                        gap={gap}
                        gapOffset={gapOffset}
                        multiselect={multiselect}
                        showFoldIcon={showFoldIcon}
                        nameProperty={nameProperty}
                        idProperty={idProperty}
                        childrenProperty={childrenProperty}
                        pathProperty={pathProperty}
                        originalInfos={originalInfos || infos}
                        pathSeperator={pathSeperator}
                        passWrapperProps={passWrapperProps}
                    />);
                })}
                <div
                    className={prefix("guideline")}
                    ref={ref(this, "guidelineElement")}
                ></div>
                {this.renderShadows()}
            </FolderElement>
        );
    }
}
