import { FastifyReply, FastifyRequest } from 'fastify';
import { Create_User_ZOD } from '@/_validation/userZOD';
import mongoose from 'mongoose';
import { UserAccountModel, UserModel } from '@/_models';
import { ImageManager } from '@/_lib/image';

export const CreateUserRouter = async (
  req: FastifyRequest<{ Body: string }>,
  res: FastifyReply
) => {
  const session = await mongoose.startSession();
  const AvatarIMGManager = new ImageManager(session, 'User', req.user);
  const BannerIMGManager = new ImageManager(session, 'User', req.user);

  try {
    const data = Create_User_ZOD.parse(JSON.parse(req.body));

    session.startTransaction();

    const newUser = new UserModel(data.user);

    if (data.user.avatar)
      newUser.avatar = await AvatarIMGManager.createRelationFromURL(data.user.avatar);

    if (data.user.banner)
      newUser.banner = await BannerIMGManager.createRelationFromURL(data.user.banner);

    await newUser.validate();

    const newAccount = new UserAccountModel({
      user: newUser._id,
      userId: newUser.id,
      email: data.account.email,
      verified: new Date()
    });

    await newAccount.validate();

    await newAccount.save({ validateBeforeSave: false, session });
    const savedNewUser = await newUser.save({ validateBeforeSave: false, session });

    await UserModel.populate(savedNewUser, {
      path: 'avatar.data',
      select: '-_id',
      justOne: true,
      options: { session }
    });

    await session.commitTransaction();
    await session.endSession();
    return savedNewUser.toJSON();
  } catch (err) {
    AvatarIMGManager.deleteImageFile();
    BannerIMGManager.deleteImageFile();
    console.log(err);
    if (session.inTransaction()) await session.abortTransaction();
    res.code(400).send();
  }
};
