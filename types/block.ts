import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose"

export interface IBlock extends Document {
  blockerId: mongoose.Types.ObjectId
  blockedUserId: mongoose.Types.ObjectId
  createdAt: Date
}

const BlockSchema = new Schema<IBlock>(
  {
    blockerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    blockedUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

/*
 * Prevent duplicate blocks.
 */
BlockSchema.index(
  {
    blockerId: 1,
    blockedUserId: 1,
  },
  {
    unique: true,
  }
)

/*
 * Quickly find users blocked by a user.
 */
BlockSchema.index({
  blockerId: 1,
  createdAt: -1,
})

/*
 * Quickly determine who blocked a user.
 */
BlockSchema.index({
  blockedUserId: 1,
  createdAt: -1,
})

const Block: Model<IBlock> =
  mongoose.models.Block ||
  mongoose.model<IBlock>(
    "Block",
    BlockSchema
  )

export default Block