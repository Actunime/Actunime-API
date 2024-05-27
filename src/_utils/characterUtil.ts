export const CharacterRoleObj = {
  PRINCIPAL: {
    label: "Principal",
    description: "Personnage principal de l'histoire.",
  },
  SECONDAIRE: {
    label: "Secondaire",
    description: "Personnage secondaire de l'histoire.",
  },
  FIGURANT: {
    label: "Figurant",
    description:
      "Personnage qui apparaît dans l'histoire mais n'a pas d'influence directe sur celle-ci.",
  },
  ANTAGONISTE: {
    label: "Antagoniste",
    description: "Personnage qui est l'ennemi principal de l'histoire.",
  },
  SOUTIEN: {
    label: "Soutien",
    description: "Personnage qui apporte de l'aide et du soutien au personnage principal."
  }
}

export type ICharacterRole = keyof typeof CharacterRoleObj;
export const CharacterRoleArray = Object.keys(CharacterRoleObj) as ICharacterRole[] & [string, ...string[]];
export const CharacterRoleSelection = CharacterRoleArray.map((key) => ({
  label: CharacterRoleObj[key].label,
  description: CharacterRoleObj[key].description,
  value: key
}))

export const CharacterGenderObj = {
  MASCULIN: {
    label: "Masculin",
    description:
      "Personnage qui a une apparence physique traditionnellement associée à la masculinité.",
  },
  FEMININ: {
    label: "Féminin",
    description:
      "Personnage qui a une apparence physique traditionnellement associée à la feminité.",
  },
  NEUTRE: {
    label: "Neutre",
    description:
      "Personnage dont l'apparence physique n'est pas forcément associée à la masculinité ou à la féminité, ou qui répresentent des caractéristiques des deux genres.",
  },
  TRANSGENRE: {
    label: "Transgenre",
    description:
      "Personnage qui ne se identifie pas avec le genre traditionnel associé à son apparence physique.",
  },
  NON_BINAIRE: {
    label: "Non binaire",
    description:
      "Personnage qui ne se identifie pas avec les genres traditionnels masculin ou féminin, mais qui ne s'identifie pas non plus comme neutre."
  },
  GENRE_FLUIDE: {
    label: "Genre fluide",
    description:
      "Personnage dont l'identité de genre est en constante évolution et qui ne se situe pas dans l'une des catégories traditionnelles.",
  },
  AUTRE: {
    label: "Autre",
    description: "Personnage qui ne se trouve pas dans la liste ci-dessus."
  }
}

export type ICharacterGender = keyof typeof CharacterGenderObj;
export const CharacterGenderArray = Object.keys(CharacterGenderObj) as ICharacterGender[] & [string, ...string[]];
export const CharacterGenderSelection = CharacterGenderArray.map((key) => ({
  label: CharacterGenderObj[key].label,
  description: CharacterGenderObj[key].description,
  value: key
}))

export const CharacterSpeciesObj = {
  HUMAIN: {
    label: "Humain",
    description:
      "Personnage qui a une apparence physique associée à un humain, avec des caractéristiques comme des yeux, des cheveux, une peau claire, des mains et des pieds humains, etc.",
  },
  ELFE: {
    label: "Elfe",
    description:
      "Personnage avec des caractéristiques physiques associées à l'elfe.",
  },
  NAIN: {
    label: "Nain",
    description:
      "Personnage avec des caractéristiques physiques associées à un nain.",
  },
  LEZARD: {
    label: "Lézard",
    description:
      "Personnage avec des caractéristiques physiques associées à un lézard.",
  },
  DRAGON: {
    label: "Dragon",
    description:
      "Personnage avec des caractéristiques physiques associées à un dragon.",
  },
  ORC: {
    label: "Orc",
    description:
      "Personnage avec des caractéristiques physiques associées à l'orc.",
  },
  AUTRE: {
    label: "Autre",
    description:
      "Personnage dont la catégorie ne correspond pas à celles proposées.",
  },
}

export type ICharacterSpecies = keyof typeof CharacterSpeciesObj;
export const CharacterSpeciesArray = Object.keys(CharacterSpeciesObj) as ICharacterSpecies[] & [string, ...string[]];
export const CharacterSpeciesSelection = CharacterSpeciesArray.map((key) => ({
  label: CharacterSpeciesObj[key].label,
  description: CharacterSpeciesObj[key].description,
  value: key
}))