
'use client';

import React from 'react';

// A private base component for the individual shaded blocks.
// The parent container should have the `animate-pulse` class.
const SkeletonBlock = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={`bg-muted/40 rounded-md ${className}`} {...props} />
);

/**
 * A simple, single-line skeleton loader with a pulse animation.
 * Use this for basic content placeholders.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-muted/40 rounded-md ${className}`}
      {...props}
    />
  );
}

/**
 * A skeleton loader for a dashboard statistic card.
 * Use this while fetching data for stat cards.
 */
export function SkeletonCard() {
    return (
        <div className="p-6 h-28 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-muted/30">
            <div className="flex items-start justify-between">
                <div>
                    <SkeletonBlock className="h-4 w-24" />
                    <SkeletonBlock className="h-10 w-16 mt-2" />
                </div>
                <div className="p-3 bg-muted/20 rounded-lg">
                    <SkeletonBlock className="w-6 h-6 rounded-full" />
                </div>
            </div>
        </div>
    );
}

/**
 * A skeleton loader for a list item, such as in user or class management pages.
 * Repeats this component to show a list is loading.
 */
export function SkeletonListRow() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-4 bg-background/50 border border-muted/20 rounded-lg">
            <SkeletonBlock className="h-5" />
            <SkeletonBlock className="h-5" />
            <SkeletonBlock className="h-5 w-24" />
            <div className="flex justify-end">
                <SkeletonBlock className="w-8 h-8 rounded-full" />
            </div>
        </div>
    );
}
