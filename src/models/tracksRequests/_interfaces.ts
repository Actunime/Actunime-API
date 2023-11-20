import { PersonRequestProps } from "../personsRequests/_interfaces"


export interface TrackRequestProps {
    label: string
    name: string
    artists: ArtistForTrackInput[]
    episodes: number[]
    createdDate: string
}

interface ArtistForTrackInput {
    old: number[]
    new: PersonRequestProps[]
}