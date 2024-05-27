import { ReportModel } from "../_models/_reportModel";
import { UserModel } from "../_models/_userModel";
import { IReportCreateProps } from "../_types/reportType";
import { CreateActivity } from "./activity";

export function ReportPath(props: Omit<IReportCreateProps, "targetPath">) {
  return {
    User: async () => {
      const findTarget = await UserModel.findOne({ id: props.target.id });

      if (!findTarget) {
        throw new Error("Utilisateur inexistant");
      }

      await ReportModel.create({ ...props, targetPath: "User" });

      await CreateActivity("MEMBER", "CREATE_REPORT", {
        author: props.author,
        target: props.target,
        targetPath: "User",
      });
    },
  };
}
