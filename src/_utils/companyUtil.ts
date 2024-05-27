export const CompanyTypeObj = {
  STUDIO: "Studio",
  PRODUCER: "Producteur",
};

export type ICompanyType = keyof typeof CompanyTypeObj;
export const CompanyTypeArray = Object.keys(CompanyTypeObj) as ICompanyType[] & [string, ...string[]]
export const CompanyTypeSelection = CompanyTypeArray.map((key) => ({
  label: CompanyTypeObj[key],
  value: key
}))
