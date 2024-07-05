import { z } from 'zod';
import { zodNumber } from './util';
import { IImage } from '../_types/imageType';

export const Image_Pagination_ZOD = z
  .object({
    page: zodNumber(),
    limit: zodNumber(),
    strict: z.boolean().optional(),
    sort: z
      .object({
        createdAt: z.enum(['DESC', 'ASC']).optional(),
        updatedAt: z.enum(['DESC', 'ASC']).optional()
      })
      .partial()
      .strict(),
    query: z.object({}).partial().strict(),
    with: z.object({}).partial().strict()
  })
  .partial()
  .strict();

export type IImage_Pagination_ZOD = z.infer<typeof Image_Pagination_ZOD>;

export const Create_Image_ZOD = z.object({
  value: z.string()
});

export type ICreate_Image_ZOD = z.infer<typeof Create_Image_ZOD>;

export const Add_Image_ZOD = z.object({
  id: z.optional(z.string()),
  newImage: z.optional(Create_Image_ZOD)
});

export type IAdd_Image_ZOD = z.infer<typeof Add_Image_ZOD>;

export const ImageDataToZOD = (data: IImage): Partial<ICreate_Image_ZOD> => {
  if (!data) return {};

  const toZOD: Partial<ICreate_Image_ZOD> = {
    value: data.url
  };

  const safeParse = Create_Image_ZOD.safeParse(toZOD);

  if (safeParse.success) return safeParse.data;

  return toZOD;
};
