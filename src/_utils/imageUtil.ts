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
