"use server";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

function buildUniqueUsername(base: string, clerkId: string) {
  const sanitized = base.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() || "user";
  const suffix = clerkId.slice(-6).toLowerCase();
  const trimmedBase = sanitized.slice(0, 16);
  return `${trimmedBase}_${suffix}`;
}

// this will amke sure that this code will be running on the server

export async function syncUser(clerkId?: string) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    const resolvedClerkId = userId ?? clerkId;
    if (!resolvedClerkId) return null;

    const primaryEmail =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses[0]?.emailAddress;
    if (!primaryEmail) return null;

    const preferredBase =
      user?.username ??
      primaryEmail.split("@")[0] ??
      "user";
    const candidateUsername = buildUniqueUsername(
      preferredBase,
      resolvedClerkId,
    );

    const dbUser = await prisma.user.upsert({
      where: {
        clerkId: resolvedClerkId,
      },
      update: {
        name: `${user?.firstName || ""} ${
          user?.lastName || ""
        }`.trim(),
        email: primaryEmail,
        image: user?.imageUrl || null,
      },
      create: {
        clerkId: resolvedClerkId,
        name: `${user?.firstName || ""} ${
          user?.lastName || ""
        }`.trim(),
        username: candidateUsername,
        email: primaryEmail,
        image: user?.imageUrl || null,
      },
    });

    return {
      id: dbUser.id,
      clerkId: dbUser.clerkId,
      username: dbUser.username,
      name: dbUser.name,
      email: dbUser.email,
      image: dbUser.image,
    };
  } catch (error) {
    console.error("Error syncing user:", error);
    return null;
  }
}

export async function getUserbyClerkId(clerkId: string) {
  return prisma.user.findUnique({
    where: {
      clerkId, // we can also type clerkId: clerkId
    },
    select: {
      id: true,
      clerkId: true,
      name: true,
      username: true,
      email: true,
      image: true,
      bio: true,
      location: true,
      website: true,
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true,
        },
      },
    },
  });
}

export async function getDbUserId(clerkId?: string) {
  const { userId: authUserId } = await auth();
  const resolvedClerkId = clerkId ?? authUserId;
  if (!resolvedClerkId) return null;

  let user = await getUserbyClerkId(resolvedClerkId);
  if (!user) {
    await syncUser(resolvedClerkId);
    user = await getUserbyClerkId(resolvedClerkId);
  }
  if (!user) {
    console.error("Unable to resolve DB user for clerkId", resolvedClerkId);
    return null;
  }

  return user.id;
}

export async function getRandomUsers() {
  try {
    const userId = await getDbUserId();

    if (!userId) return []; // if user is not authenticated, return an empty array

    // get three random users and exclude ourselfs and the users we already follow
    const randomUsers = await prisma.user.findMany({
      where: {
        AND: [
          { NOT: { id: userId } }, // exclude ourselfs
          {
            NOT: {
              followers: {
                some: {
                  followerId: userId,
                },
              },
            },
          }, // exclude the users we already follow
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
      take: 3,
    });

    return randomUsers;
  } catch (error) {
    console.error("Error getting random users:", error);
    return []; // return an empty array if there is an error
  }
}

export async function toggleFollow(targetUserId: string, clerkId?: string) {
  try {
    const userId = await getDbUserId(clerkId);
    if (!userId) return { success: false, error: "User not found" };
    if (userId === targetUserId) throw new Error("You can't follow yourself"); // we cant follow ourselfs
    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // if we already follow the user, unfollow them
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: targetUserId,
          },
        },
      });
    } else {
      //follow them
      await prisma.$transaction([
        // transaction basically makes sure that either all the functionalities would run or none of them would run ( it maintains atomicity )
        prisma.follows.create({
          data: {
            followerId: userId,
            followingId: targetUserId,
          },
        }),

        prisma.notification.create({
          data: {
            type: "FOLLOW",
            userId: targetUserId, // user being followed
            creatorId: userId, // user following
          },
        }),
      ]);
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.log("Error in toggleFollow", error);
    return { success: false, error: "Failed to toggle follow" };
  }
}
