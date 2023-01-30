import * as React from "react";
import { FoldIconProps } from "./types";
import { prefix } from "./utils";

export function DefaultFoldIcon(props: FoldIconProps) {
    return <div
        className={`${props.className} ${prefix("default-fold-icon")}`}
    ></div>
}
