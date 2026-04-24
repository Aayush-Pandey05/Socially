"use client";

import { useEffect, useState } from "react";
import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import Link from "next/link";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { LinkIcon, MapPinIcon } from "lucide-react";
import { getUserbyClerkId, syncUser } from "@/actions/user.action";

type DbUser = NonNullable<Awaited<ReturnType<typeof getUserbyClerkId>>>;

function Sidebar() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadUser = async () => {
      if (!isLoaded) return;

      if (!isSignedIn || !user) {
        if (isActive) {
          setDbUser(null);
          setIsLoadingUser(false);
        }
        return;
      }

      try {
        setIsLoadingUser(true);
        await syncUser();
        const currentDbUser = await getUserbyClerkId(user.id);

        if (isActive) {
          setDbUser(currentDbUser);
        }
      } finally {
        if (isActive) {
          setIsLoadingUser(false);
        }
      }
    };

    void loadUser();

    return () => {
      isActive = false;
    };
  }, [isLoaded, isSignedIn, user]);

  if (!isLoaded || isLoadingUser) return <LoadingSidebar />;
  if (!isSignedIn) return <UnAuthenticatedSidebar />;
  if (!dbUser) return null;

  // console.log({user});

  return (
    <div className="sticky top-20">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <Link
              href={`/profile/${user.username}`}
              className="flex flex-col items-center justify-center"
            >
              <Avatar className="w-20 h-20 border-2 ">
                <AvatarImage src={dbUser.image || "/avatar.png"} />
              </Avatar>

              <div className="mt-4 space-y-1">
                <h3 className="font-semibold">{dbUser.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {dbUser.username}
                </p>
              </div>
            </Link>

            {dbUser.bio && (
              <p className="mt-3 text-sm text-muted-foreground">{dbUser.bio}</p>
            )}

            <div className="w-full">
              <Separator className="my-4" />
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{dbUser._count.following}</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </div>
                <Separator orientation="vertical" />
                <div>
                  <p className="font-medium">{dbUser._count.followers}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
              </div>
              <Separator className="my-4" />
            </div>

            <div className="w-full space-y-2 text-sm">
              <div className="flex items-center text-muted-foreground">
                <MapPinIcon className="w-4 h-4 mr-2" />
                {dbUser.location || "No location"}
              </div>
              <div className="flex items-center text-muted-foreground">
                <LinkIcon className="w-4 h-4 mr-2 shrink-0" />
                {dbUser.website ? (
                  <a
                    href={`${dbUser.website}`}
                    className="hover:underline truncate"
                    target="_blank"
                  >
                    {dbUser.website}
                  </a>
                ) : (
                  "No website"
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Sidebar;

const LoadingSidebar = () => (
  <div className="sticky top-20">
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4 animate-pulse">
          <div className="mx-auto h-20 w-20 rounded-full bg-muted" />
          <div className="space-y-2 text-center">
            <div className="mx-auto h-4 w-32 rounded bg-muted" />
            <div className="mx-auto h-3 w-20 rounded bg-muted" />
          </div>
          <div className="h-16 rounded bg-muted" />
          <div className="h-10 rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  </div>
);

const UnAuthenticatedSidebar = () => (
  <div className="sticky top-20">
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-xl font-semibold">
          Welcome Back!
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center text-muted-foreground mb-4">
          Login to access your profile and connect with others.
        </p>
        <SignInButton mode="modal">
          <Button className="w-full" variant="outline">
            Login
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button className="w-full mt-2" variant="default">
            Sign Up
          </Button>
        </SignUpButton>
      </CardContent>
    </Card>
  </div>
);
