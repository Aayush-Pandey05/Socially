"use server";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// this will amke sure that this code will be running on the server

export async function syncUser() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) return; // if user is not authenticated, return

    const existingUser = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    });

    if (existingUser) return existingUser; // if user already exists in the database, return it

    if (!userId || !user) return;

    const dbUser = await prisma.user.create({
      data: {
        clerkId: userId,
        name: `${user.firstName || ""} ${user.lastName || ""}`,
        username:
          user.username ?? user.emailAddresses[0].emailAddress.split("@")[0],
        email: user.emailAddresses[0].emailAddress,
        image: user.imageUrl,
      },
    });
  } catch (error) {}
}

export async function getUserbyClerkId(clerkId: string) {
  return prisma.user.findUnique({
    where: {
      clerkId, // we can also type clerkId: clerkId
    },
    include: {
      // we are basically getting the relationships of the user
      _count: {
        // we are using this to cout the parameters
        select: {
          followers: true,
          following: true,
          posts: true,
        },
      },
    },
  });
}

export async function getDbUserId() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthenticated user");

  const user = await getUserbyClerkId(clerkId);
  if (!user) throw new Error("User not found");

  return user.id;
}

export async function getRandomUsers() {
  try {
    const userId = await getDbUserId();

    // get three random users and exclude ourselfs and the users we already follow 
    const randomUsers = await prisma.user.findMany({
      where: {
        AND : [
          {NOT: {id: userId}}, // exclude ourselfs
          {
            NOT: {
              followers: {
                some: {
                  followerId: userId
                }
              }
            }
          }, // exclude the users we already follow
        ]
      },
      select:{
        id: true,
        name: true, 
        username: true,
        image: true,
        _count: {
          select:{
            followers: true,
          }
        }
      },
      take: 3,
    })

    return randomUsers;
  } catch (error) {
    console.error("Error getting random users:", error);
    return []; // return an empty array if there is an error
  }
}

export async function toggleFollow(targetUserId: string) {
  try {
    const userId = await getDbUserId();
    if(userId === targetUserId) throw new Error("You can't follow yourself"); // we cant follow ourselfs
    const existingFollow = await prisma.follows.findUnique({
      where:{
        followerId_followingId:{
          followerId: userId,
          followingId: targetUserId,
        }
      }
    })

    if(existingFollow){
      // if we already follow the user, unfollow them
      await prisma.follows.delete({
        where:{
          followerId_followingId:{
            followerId: userId,
            followingId: targetUserId,
          }
        }
      })
    }else {
      //follow them 
      await prisma.$transaction([ // transaction basically makes sure that either all the functionalities would run or none of them would run ( it maintains atomicity )
        prisma.follows.create({
          data: {
            followerId: userId,
            followingId: targetUserId,
          }
        }),

        prisma.notification.create({
          data: {
            type: "FOLLOW",
            userId: targetUserId, // user being followed
            creatorId: userId,// user following
          }
        })
      ])
    }
    
    revalidatePath("/");
    return {success: true};

  } catch (error) {
    console.log("Error in toggleFollow", error);
    return {success: false, error};
  }
}