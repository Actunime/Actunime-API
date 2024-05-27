
import { TargetPathArray } from "../../../_utils/global";
import mongoose from "mongoose";



export async function Get() {
    const connection = mongoose.connection;
    const collections = await connection.db.listCollections().toArray();

    let dateMonth = new Date();
    dateMonth.setMonth(dateMonth.getMonth() ? dateMonth.getMonth() - 1 : 11);

    const colsCount = await Promise.all(collections.map(async (col) => {
        const collection = connection.db.collection(col.name);

        let count = await collection.countDocuments();
        let mounth = await collection.countDocuments({ createdAt: { $gte: dateMonth } });

        let colName = col.name.replace("ies", "y");

        if (colName.endsWith("s"))
            colName = colName.slice(0, -1);

        let findPath = TargetPathArray.find((path) => colName === path.toLocaleLowerCase()) // -1 pour enlever le 'y' mongoose remplace y par "ies"

        if (!findPath)
            return [colName, { count, mounth }];

        return [findPath, { count, mounth }];
    }))

    let objCount = Object.fromEntries(colsCount);
    console.log('objCount', objCount)

    return Response.json(objCount, { status: 200 });
}