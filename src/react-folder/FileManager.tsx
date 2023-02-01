import * as React from "react";
import Folder from "./FolderManager";
import { FileInfo, FileManagerProps, FileProps } from "./types";
import { getChildren, getId, getName, getPath, prefix } from "./utils";

export default class FileManager<T extends {} = {}>
    extends React.PureComponent<FileManagerProps<T>> {
    public static defaultProps = {};
    public folderRef = React.createRef<Folder>();
    public render() {
        const {
            childrenProperty,
            pathProperty,
            nameProperty,
            idProperty,
            index,
            info,
            scope,
            FileComponent,
            FoldIcon,
            isPadding,
            showFoldIcon = true,
            gap,
            multiselect,
            selected,
            folded,
            originalInfos,
            pathSeperator,
            passWrapperProps,
            gapOffset,
            preventSelect,
        } = this.props;
        const id = getId(idProperty, info, index, scope);
        const name = getName(nameProperty, info, index, scope);
        const children = getChildren(childrenProperty, info, scope);
        const path = getPath!(pathProperty, id, scope, info, index);
        const pathUrl = path.join(pathSeperator);
        const nextScope = [...scope, id];
        const length = scope.length;
        const isFolder = children && children.length > 0;
        const gapWidth = gap! * (length + 1) + gapOffset!;
        const isFolded = this.isFolded(pathUrl);

        const isSelected = this.isSelected(pathUrl);
        let className = prefix("file", isSelected ? "selected" : "");
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
            value: info,
            path,
            gapWidth,
            isSelected,
        }) || {};

        if (passedStyle) {
            style = {
                ...style,
                ...passedStyle,
            };
        };

        return (
            <div className={prefix("property")}>
                <div
                    className={className}
                    data-file-path={pathUrl}
                    style={style}
                    {...otherProps}
                >
                    <div className={prefix("file-name")}>
                        {isFolder && FoldIcon && showFoldIcon && <FoldIcon
                            className={prefix("fold-icon", prefix(isFolded ? "fold" : ""))}
                            scope={scope}
                            name={name}
                            value={info}
                            path={path}
                            isSelected={isSelected}
                            isFolded={isFolded} />}
                        <FileComponent<T>
                            scope={scope}
                            name={name}
                            value={info}
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
                        FoldIcon={FoldIcon}
                        nameProperty={nameProperty}
                        idProperty={idProperty}
                        pathProperty={pathProperty}
                        childrenProperty={childrenProperty}
                        showFoldIcon={showFoldIcon}
                        selected={selected}
                        preventSelect={preventSelect}
                        folded={folded}
                        isPadding={isPadding}
                        gap={gap}
                        gapOffset={gapOffset}
                        multiselect={multiselect}
                        originalInfos={originalInfos}
                        isChild={true}
                        display={isFolded ? "none" : "block"}
                        pathSeperator={pathSeperator}
                        passWrapperProps={passWrapperProps}
                    />
                )}
            </div>
        );
    }
    public getInfo(): T {
        return this.props.info;
    }
    public isSelected(path: string) {
        const selected = this.props.selected;

        return selected && selected.indexOf(path) > -1;
    }
    public isFolded(path: string) {
        const folded = this.props.folded;

        return folded && folded.indexOf(path) > -1;
    }
    public findFile(targetPathUrl: string): FileManager<T> | null {
        const {
            childrenProperty,
            pathProperty,
            idProperty,
            index,
            info,
            scope,
            pathSeperator,
        } = this.props;
        const id = getId(idProperty, info, index, scope);
        const children = getChildren(childrenProperty, info, scope);
        const path = getPath!(pathProperty, id, scope, info, index);
        const pathUrl = path.join(pathSeperator);

        if (targetPathUrl === pathUrl) {
            return this;
        }
        const childFolder = this.folderRef.current;

        if (!children || !children.length || !childFolder) {
            return null;
        }

        return childFolder.findFile(targetPathUrl);
    }
}
