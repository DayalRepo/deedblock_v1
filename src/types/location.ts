export interface SurveyNumber {
    number: string;
    govtValue: number;
}

export interface DoorNumber {
    number: string;
    govtValue: number;
}

export interface Village {
    name: string;
    surveyNumbers: SurveyNumber[];
    doorNumbers?: DoorNumber[];
}

export interface Mandal {
    name: string;
    villages: Village[];
}

export interface District {
    name: string;
    mandals: Mandal[];
}

export interface StateData {
    name: string;
    stampDuty: number; // Percentage
    districts: District[];
}
