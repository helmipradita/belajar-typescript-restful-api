import {z, ZodType} from "zod";

export class Validation {

    static validate<T extends ZodType>(schema: T, data: unknown): z.infer<T> {
        return schema.parse(data);
    }

}
