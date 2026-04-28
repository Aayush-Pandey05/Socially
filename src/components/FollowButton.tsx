"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Button } from "./ui/button";
import { Loader2Icon } from "lucide-react";
import toast from "react-hot-toast";
import { syncUser, toggleFollow } from "@/actions/user.action";

function FollowButton({ userId }: { userId: string }) {
  const { user } = useUser();

  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      if (user) {
        await syncUser(user.id);
      }

      const result = await toggleFollow(userId, user?.id);
      if (result?.success) {
        toast.success("Followed user successfully");
      } else {
        toast.error(result?.error || "Failed to follow user");
      }
    } catch (error) {
      toast.error("Failed to follow user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size={"sm"}
      variant={"secondary"}
      onClick={handleFollow}
      disabled={isLoading}
      className="w-20"
    >
      {isLoading ? <Loader2Icon className="animate-spin size-4" /> : "Follow"}
    </Button>
  );
}

export default FollowButton;
