import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, User, Baby, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type AvatarType = "child" | "adult" | "senior";

interface AvatarSelectorProps {
  avatarUrl?: string;
  avatarType?: AvatarType;
  name?: string;
  age?: number;
  onAvatarChange: (url: string, type: AvatarType) => void;
  className?: string;
}

const avatarIcons = {
  child: Baby,
  adult: User,
  senior: Users,
};

const avatarColors = {
  child: "bg-blue-100 text-blue-600",
  adult: "bg-purple-100 text-purple-600",
  senior: "bg-amber-100 text-amber-600",
};

function getAvatarTypeFromAge(age?: number): AvatarType {
  if (!age) return "adult";
  if (age < 18) return "child";
  if (age >= 60) return "senior";
  return "adult";
}

export function AvatarSelector({
  avatarUrl,
  avatarType,
  name = "User",
  age,
  onAvatarChange,
  className,
}: AvatarSelectorProps) {
  const { toast } = useToast();
  const { user, isGuest } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const derivedType = avatarType || getAvatarTypeFromAge(age);
  const Icon = avatarIcons[derivedType];
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please select an image file.",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please select an image under 5MB.",
      });
      return;
    }

    if (isGuest || !user) {
      // For guests, use local URL
      const localUrl = URL.createObjectURL(file);
      onAvatarChange(localUrl, derivedType);
      toast({ title: "Avatar updated", description: "Saved locally (guest mode)." });
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      onAvatarChange(publicUrl + `?t=${Date.now()}`, derivedType);
      toast({ title: "Avatar uploaded", description: "Your profile picture has been updated." });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Could not upload avatar. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative">
        <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={name} />
          ) : null}
          <AvatarFallback className={cn("text-xl font-bold", avatarColors[derivedType])}>
            {avatarUrl ? initials : <Icon className="h-10 w-10" />}
          </AvatarFallback>
        </Avatar>
        
        <Button
          size="icon"
          variant="secondary"
          className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-md"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Camera className="h-4 w-4" />
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
      
      <div className="text-center">
        <p className="font-semibold">{name || "Set your name"}</p>
        <p className="text-xs text-muted-foreground capitalize">{derivedType} profile</p>
      </div>
      
      {isUploading && (
        <p className="text-xs text-muted-foreground animate-pulse">Uploading...</p>
      )}
    </div>
  );
}
