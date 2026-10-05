import mongoose from "mongoose";
import Connection from "@/models/connection.model";
import User from "@/models/user.model";
import Block from "@/models/block.model";

export async function sendConnectionRequest(
  requesterId: string,
  receiverId: string
) {
  if (requesterId === receiverId) {
    throw new Error(
      "You cannot connect with yourself."
    );
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      receiverId
    )
  ) {
    throw new Error("Invalid receiver ID.");
  }

  const receiver =
    await User.findById(receiverId)
      .select("_id");

  if (!receiver) {
    throw new Error(
      "User you are trying to connect with does not exist."
    );
  }

  const blocked =
    await Block.findOne({
      $or: [
        {
          blockerId: requesterId,
          blockedId: receiverId,
        },
        {
          blockerId: receiverId,
          blockedId: requesterId,
        },
      ],
    });

  if (blocked) {
    throw new Error(
      "You cannot connect with this user."
    );
  }

  const existing =
    await Connection.findOne({
      $or: [
        {
          requesterId,
          receiverId,
        },
        {
          requesterId: receiverId,
          receiverId: requesterId,
        },
      ],
    });

  if (existing) {
    if (
      existing.status === "ACCEPTED"
    ) {
      throw new Error(
        "You are already connected."
      );
    }

    if (
      existing.status === "PENDING"
    ) {
      throw new Error(
        "A connection request already exists."
      );
    }

    if (
      existing.status === "REJECTED"
    ) {
      existing.requesterId =
        new mongoose.Types.ObjectId(
          requesterId
        );

      existing.receiverId =
        new mongoose.Types.ObjectId(
          receiverId
        );

      existing.status = "PENDING";

      await existing.save();

      return existing;
    }
  }

  return Connection.create({
    requesterId,
    receiverId,
    status: "PENDING",
  });
}