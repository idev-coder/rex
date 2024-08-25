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

/**
 * Create a Rex element.
 *
 * You should not use this function directly. Use JSX and a transpiler instead.
 */
export function jsx(
    type: Rex.ElementType,
    props: unknown,
    key?: Rex.Key,
): Rex.RexElement;

/**
 * Create a Rex element.
 *
 * You should not use this function directly. Use JSX and a transpiler instead.
 */
export function jsxs(
    type: Rex.ElementType,
    props: unknown,
    key?: Rex.Key,
): Rex.RexElement;
