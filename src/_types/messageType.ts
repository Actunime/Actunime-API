import { ITargetPath } from "../_utils/global";
import { IUser } from "./userType";




export interface IMessage {
    id: string;
    content: string;
    changes: { content: string, at: Date }[]
    replyTo?: { id: string; data?: IMessage; }
    replys?: IMessage[] // Virtual
    author: { id: string; data?: IUser; };
    target: { id: string; data?: any; };
    targetPath: ITargetPath;
    deleted: boolean;
    deletedBy?: { id: string; data?: IUser; }
    deletedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}