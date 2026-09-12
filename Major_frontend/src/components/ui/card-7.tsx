import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

// Define the props for the TravelCard component
interface TravelCardProps extends React.HTMLAttributes<HTMLDivElement> {
  imageUrl?: string;
  imageAlt?: string;
  logo?: React.ReactNode;
  title: string;
  location?: string;
  overview: string;
  price?: number | string;
  pricePeriod?: string;
  onBookNow?: () => void;
  ctaText?: string;
}

const TravelCard = React.forwardRef<HTMLDivElement, TravelCardProps>(
  (
    {
      className,
      imageUrl,
      imageAlt = "",
      logo,
      title,
      location,
      overview,
      price,
      pricePeriod,
      onBookNow,
      ctaText = "Explore Step",
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "group relative w-full overflow-hidden rounded-2xl border border-black/10 bg-[#2B2644] text-white shadow-md",
          "transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-2",
          className
        )}
        {...props}
      >
        {/* Background Image with Zoom Effect on Hover (if provided) */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#2B2644] via-[#241e3a] to-[#1a152b]" />
        )}

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

        {/* Content Container */}
        <div className="relative flex h-full min-h-[380px] flex-col justify-between p-7 text-white">
          {/* Top Section: Logo / Step Badge */}
          <div className="flex h-28 items-start">
            {logo && (
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/40 bg-black/30 backdrop-blur-sm">
                {logo}
              </div>
            )}
          </div>

          {/* Middle Section: Details (slides up on hover) */}
          <div className="space-y-4 transition-transform duration-500 ease-in-out group-hover:-translate-y-16">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-white">{title}</h3>
              {location && <p className="text-xs font-mono font-medium text-white/70 uppercase tracking-wider">{location}</p>}
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-wider text-white/80 uppercase">OVERVIEW</h4>
              <p className="text-sm leading-relaxed text-white/75">
                {overview}
              </p>
            </div>
          </div>

          {/* Bottom Section: Price/Metric and Button (revealed on hover) */}
          <div className="absolute -bottom-20 left-0 w-full p-7 opacity-0 transition-all duration-500 ease-in-out group-hover:bottom-0 group-hover:opacity-100">
            <div className="flex items-end justify-between">
              <div>
                {price !== undefined && (
                  <span className="text-2xl font-bold text-white">{price}</span>
                )}
                {pricePeriod && (
                  <span className="text-xs text-white/70"> {pricePeriod}</span>
                )}
              </div>
              <Button
                onClick={onBookNow}
                size="sm"
                className="rounded-full bg-white font-medium text-black hover:bg-white/90"
              >
                {ctaText} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
TravelCard.displayName = "TravelCard";

export { TravelCard };
