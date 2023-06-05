import { PersonBase } from "./person";
import { UserOutput } from "./user";
import { Pagination } from "./utils";



export interface StaffOutput extends PersonBase {
    contributors: (page: Pagination) => UserOutput[];
}