import { OnDragStart } from "gesto";
import File from "./File";

export interface FileInfo<T> {
    id: string;
    scope: string[];
    pathUrl: string;
    parentPathUrl: string;
    path: string[];
    parentPath: string[];
    parentFileInfo: FileInfo<T> | null | undefined;
    parentValue: T | null | undefined;
    depth: number;
    index: number;
    value: T;
}
export type FoldIconProps<T = any, U = {}> = FileProps<T, U> & {
    className: string;
    isFolded: boolean;
    isSelected: boolean;
}
export type FileWrapperProps<T = any, U = {}> = FileProps<T, U> & {
    className: string;
    gapWidth: number;
    isSelected: boolean;
    isShadow?: boolean;
    style: Record<string, any>;
};
export type FileProps<T = any, U = {}> = {
    name: string;
    scope: string[];
    path: string[];
    value: T;
} & U;

export interface FileManagerProps<T extends {}> {
    index: number;
    info: T;
    scope: string[];
    selected: string[];
    folded: string[];
    multiselect?: boolean;
    pathSeperator?: string;
    passWrapperProps?: (props: FileWrapperProps<T>) => Record<string, any> | null | undefined;
    FileComponent: ((props: FileProps<T>) => any) | typeof File;
    FoldIcon?: (props: FoldIconProps) => any;

    preventSelect?: boolean;
    originalInfos: T[];
    showFoldIcon?: boolean;
    isPadding?: boolean;
    gap?: number;
    gapOffset?: number;

    nameProperty?:
    | (keyof T & string)
    | ((value: T, index: any, scope: any[]) => any);
    idProperty?:
    | (keyof T & string)
    | ((value: T, index: any, scope: any[]) => string | number);
    childrenProperty?: (keyof T & string) | ((value: T, scope: any[]) => any);
    pathProperty?:
    | (keyof T & string)
    | ((id: string, scope: any[], value: T, index: any) => string[]);
}

export interface FolderProps<T> {
    infos: T[];
    originalInfos?: T[];
    FileComponent: ((props: FileProps<T>) => any) | typeof File;
    FoldIcon?: (props: FoldIconProps) => any;
    scope?: string[];
    selected?: string[] | null;
    folded?: string[] | null;
    multiselect?: boolean;
    isMove?: boolean;
    showFoldIcon?: boolean;
    isPadding?: boolean;
    isMoveChildren?: boolean;
    display?: string;
    pathSeperator?: string;
    gap?: number;
    gapOffset?: number;
    fontColor?: string;
    backgroundColor?: string;
    selectedColor?: string;
    borderColor?: string;
    guidelineColor?: string;
    iconColor?: string;
    preventSelect?: boolean;
    passWrapperProps?: (props: FileWrapperProps<T>) => Record<string, any> | null | undefined;
    urlProperty?: (id: string, scope: any[], value: T, index: any) => string;
    nameProperty?:
    | (keyof T & string)
    | ((value: T, index: any, scope: any[]) => any);
    idProperty?:
    | (keyof T & string)
    | ((value: T, index: any, scope: any[]) => string | number);
    childrenProperty?: (keyof T & string) | ((value: T, scope: any[]) => any);
    pathProperty?:
    | (keyof T & string)
    | ((id: string, scope: any[], value: T, index: any) => string[]);

    dragCondtion?: (e: OnDragStart) => boolean;
    checkMove?: (e: MoveInfo<T>) => boolean;
    onMove?: (e: OnMove<T>) => any;
    onSelect?: (e: OnSelect<T>) => any;
    onFold?: (e: OnFold) => any;
    isChild?: boolean;
}

export interface FolderState<T> {
    shadows: Array<FileInfo<T>>;
}

export interface MoveInfo<T> {
    depth: number;
    // path: string[];
    // pathUrl: string;
    parentInfo?: FileInfo<T> | null | undefined;
    prevInfo?: FileInfo<T> | null | undefined;
    nextInfo?: FileInfo<T> | null | undefined;
}

export interface OnMove<T> extends MoveInfo<T> {
    flattenInfos: Array<FileInfo<T>>;
    flattenPrevInfo: FileInfo<T> | null | undefined;
    children: T[];
    childrenInfos: Array<FileInfo<T>>;
    selected: string[];
    selectedInfos: Array<FileInfo<T>>;
    nextFolded: string[];
}

export interface OnSelect<T> {
    path: string[];
    pathUrl: string;
    isSelected: boolean;
    selected: string[];
    selectedInfos: Array<FileInfo<T>>;
}

export interface OnFold {
    path: string[];
    pathUrl: string;
    isFolded: boolean;
    folded: string[];
}
