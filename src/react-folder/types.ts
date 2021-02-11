import File from "./File";

export interface FileInfo<T> {
  id: string;
  scope: string[];
  path: string;
  parentFileInfo: FileInfo<T> | null | undefined;
  parentInfo: T | null | undefined;
  parentPath: string;
  depth: number;
  index: number;
  info: T;
}

export type FileProps<T = any, U = {}> = {
  name: string;
  scope: string[];
  path: string;
  info: T;
} & U;

export interface FileManagerProps<T extends {}> {
  index: number;
  info: T;
  scope: string[];
  selected: string[];
  multiselect?: boolean;
  FileComponent: ((props: FileProps<T>) => any) | typeof File;

  originalInfos: T[];
  showFoldIcon?: boolean;
  isPadding?: boolean;
  gap?: number;

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

}

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
  fold?: boolean;

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
  isChild?: boolean;
}

export interface FolderState<T> {
  fold: boolean;
  shadows: Array<FileInfo<T>>;
}

export interface OnMove<T> {
  children: T[];
  childrenInfos: Array<FileInfo<T>>;
  selectedInfos: Array<FileInfo<T>>;
  parentInfo: FileInfo<T> | null | undefined;
  prevInfo: FileInfo<T> | null | undefined;
}
export interface OnSelect {
  selected: string[];
}
