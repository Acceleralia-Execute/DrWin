
import React, { useState, forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Avatar = forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
    ({ className, ...props }, ref) => (
        <span
            ref={ref}
            className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
            {...props}
        />
    )
);
Avatar.displayName = 'Avatar';

const AvatarImage = forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
    ({ className, ...props }, ref) => {
        const [loaded, setLoaded] = useState(false);
        return (
            <img
                className={cn("aspect-square h-full w-full", loaded ? 'opacity-100' : 'opacity-0', className)}
                ref={ref}
                {...props}
                onLoad={() => setLoaded(true)}
            />
        )
    }
);
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
    ({ className, ...props }, ref) => (
        <span
            ref={ref}
            className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}
            {...props}
        />
    )
);
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };
