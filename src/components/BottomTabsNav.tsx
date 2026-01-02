import { NavLink } from "@/components/NavLink";
import { Activity, Home, MapPin, FileText, User } from "lucide-react";

const tabs = [
  { to: "/home", label: "Home", Icon: Home },
  { to: "/health-reports", label: "Reports", Icon: FileText },
  { to: "/profile", label: "Profile", Icon: User },
  { to: "/contacts", label: "Contacts", Icon: MapPin },
  { to: "/dashboard", label: "Activity", Icon: Activity },
];

export function BottomTabsNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70"
      aria-label="Primary"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1 px-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-2">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs text-muted-foreground transition"
            activeClassName="bg-accent text-foreground"
            aria-label={label}
          >
            <Icon className="h-5 w-5" />
            <span className="leading-none">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
