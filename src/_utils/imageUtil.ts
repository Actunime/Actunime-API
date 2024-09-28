import { ITargetPath } from './global';

export const ImageLabelObj = {
  COVER: 'Couverture',
  BANNER: 'Bannière',
  AVATAR: 'Avatar',
  LOGO: 'Logo'
};

export type IImageLabel = keyof typeof ImageLabelObj;
export const ImageLabelArray = Object.keys(ImageLabelObj) as IImageLabel[] & [string, ...string[]];
export const ImageLabelSelection = ImageLabelArray.map((key) => ({
  label: ImageLabelObj[key],
  value: key
}));

export async function CreateImageCDN(value: {
  id: string;
  path: ITargetPath;
  value: string;
  valueIsUrl: boolean;
}) {
  const req = await fetch(
    'http://' + process.env.IMAGECDN_HOST + ':' + process.env.IMAGECDN_PORT + '/v1/create',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(value)
    }
  );

  if (req.status !== 200) throw new Error("Impossible de créer l'image");
}

export async function DeleteImageCDN(value: { id: string; path: ITargetPath }) {
  const req = await fetch(
    'http://' + process.env.IMAGECDN_HOST + ':' + process.env.IMAGECDN_PORT + '/v1/delete',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(value)
    }
  );

  if (req.status !== 200) throw new Error("Impossible de supprimer l'image");
}
