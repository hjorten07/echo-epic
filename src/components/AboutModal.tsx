import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Music2, Star, Users, Trophy } from "lucide-react";

interface AboutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AboutModal = ({ open, onOpenChange }: AboutModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Music2 className="w-4 h-4 text-primary-foreground" />
            </div>
            About Remelic
          </DialogTitle>
          <DialogDescription>
            Discover, rate, and share your love for music
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-muted-foreground">
            Remelic is a community-driven platform where music lovers come together to 
            discover new artists, rate their favorite songs and albums, and connect with 
            fellow enthusiasts who share their taste.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
              <Star className="w-6 h-6 text-primary" />
              <h4 className="font-semibold text-foreground">Rate Music</h4>
              <p className="text-sm text-muted-foreground">
                Share your opinions with 1-10 star ratings
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
              <Users className="w-6 h-6 text-primary" />
              <h4 className="font-semibold text-foreground">Connect</h4>
              <p className="text-sm text-muted-foreground">
                Follow friends and see their ratings
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
              <Trophy className="w-6 h-6 text-primary" />
              <h4 className="font-semibold text-foreground">Earn Badges</h4>
              <p className="text-sm text-muted-foreground">
                Unlock achievements as you rate more
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
              <Music2 className="w-6 h-6 text-primary" />
              <h4 className="font-semibold text-foreground">Discover</h4>
              <p className="text-sm text-muted-foreground">
                Find new music through community picks
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Music data powered by MusicBrainz • Built with ❤️ for music lovers
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
