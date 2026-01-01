import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

type Props = {
  open: boolean;
  countdown: number;
  onCancel: () => void;
};

export function FallDetectionAlert({ open, countdown, onCancel }: Props) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader className="text-center">
          <div className="mx-auto mb-4 p-4 rounded-full bg-destructive/20 w-fit animate-pulse">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <AlertDialogTitle className="text-xl">Fall Detected!</AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-2">
            <p>A potential fall has been detected.</p>
            <p className="text-4xl font-bold text-destructive">{countdown}</p>
            <p className="text-sm">seconds until emergency SOS is triggered</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button 
            variant="outline" 
            size="xl" 
            onClick={onCancel}
            className="w-full border-2"
          >
            I'm OK - Cancel SOS
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            ⚠️ Simulated sensor feature for demo purposes
          </p>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
