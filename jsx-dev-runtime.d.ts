// Expose `JSX` namespace in `global` namespace
import * as Rex from "./rex-client";
export { Fragment } from "./rex-client";

export namespace JSX {
    interface Element extends Rex.JSX.Element {}
    interface ElementClass extends Rex.JSX.ElementClass {}
    interface ElementAttributesProperty extends Rex.JSX.ElementAttributesProperty {}
    interface ElementChildrenAttribute extends Rex.JSX.ElementChildrenAttribute {}
    type LibraryManagedAttributes<C, P> = Rex.JSX.LibraryManagedAttributes<C, P>;
    interface IntrinsicAttributes extends Rex.JSX.IntrinsicAttributes {}
    interface IntrinsicClassAttributes<T> extends Rex.JSX.IntrinsicClassAttributes<T> {}
    interface IntrinsicElements extends Rex.JSX.IntrinsicElements {}
}

export interface JSXSource {
    /**
     * The source file where the element originates from.
     */
    fileName?: string | undefined;

    /**
     * The line number where the element was created.
     */
    lineNumber?: number | undefined;

    /**
     * The column number where the element was created.
     */
    columnNumber?: number | undefined;
}

/**
 * Create a Rex element.
 *
 * You should not use this function directly. Use JSX and a transpiler instead.
 */
export function jsxDEV(
    type: Rex.ElementType,
    props: unknown,
    key: Rex.Key | undefined,
    isStatic: boolean,
    source?: JSXSource,
    self?: unknown,
): Rex.RexElement;
