import * as React from "react";
import FolderManager from "./FolderManager";

export const PREFIX = "scena-folder-";
export const RootFolderContext = React.createContext<FolderManager | null>(null);
