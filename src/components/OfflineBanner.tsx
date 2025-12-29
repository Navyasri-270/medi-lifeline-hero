import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useI18n } from "@/i18n/I18nProvider";
import { WifiOff, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface OfflineBannerProps {
  className?: string;
}

export function OfflineBanner({ className }: OfflineBannerProps) {
  const { isOnline } = useNetworkStatus();
  const { t } = useI18n();
  const [showBanner, setShowBanner] = useState(!isOnline);
  
  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
    } else {
      // Delay hiding to show "back online" message
      const timer = setTimeout(() => setShowBanner(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showBanner) return null;

  return (
    <div
      className={cn(
        "fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors",
        isOnline 
          ? "bg-green-500 text-white" 
          : "bg-destructive text-destructive-foreground",
        className
      )}
    >
      {isOnline ? (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Back online - syncing data...</span>
        </>
      ) : (
        <>
          <AlertTriangle className="h-4 w-4 animate-pulse" />
          <span>{t("offlineBanner")}</span>
        </>
      )}
    </div>
  );
}
