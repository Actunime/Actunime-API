export const ReportSubjectObj = {
  USER_IMAGE: "Les images que l'utilisateur utilise sont inappropriées",
  USER_INFO: "Les informations mis par l'utilisateur sont inappropriées",
};

export type IReportSubject = keyof typeof ReportSubjectObj;
export const ReportSubjectArray = Object.keys(ReportSubjectObj) as IReportSubject[] & [string, ...string[]];
export const ReportSubjectSelection = ReportSubjectArray.map((key) => ({
  label: ReportSubjectObj[key],
  value: key
}))


export const ReportStatusObj = {
  "PENDING": "En attente",
  "REJECTED": "Refusé",
  "VERIFIED": "Vérifié",
};
export type IReportStatus = keyof typeof ReportStatusObj;
export const ReportStatusArray = Object.keys(ReportStatusObj) as IReportStatus[] & [string, ...string[]];
export const ReportStatusSelection = ReportStatusArray.map((key) => ({
  label: ReportStatusObj[key],
  value: key
}))