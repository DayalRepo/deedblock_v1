import { useState, useEffect } from 'react';
import { UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { RegistrationFormSchema } from '@/lib/validations/registrationSchema';
import { StateData, District, Mandal, Village, SurveyNumber, DoorNumber } from '@/types/location';
import telangana from '@/data/states/telangana.json';
import andhraPradesh from '@/data/states/andhra_pradesh.json';
import maharashtra from '@/data/states/maharashtra.json';
import karnataka from '@/data/states/karnataka.json';
import tamilNadu from '@/data/states/tamil_nadu.json';
import odisha from '@/data/states/odisha.json';

const locationData: { [key: string]: StateData } = {
    "Telangana": telangana,
    // "Andhra Pradesh": andhraPradesh, // Assuming these files exist as per original code
    // "Maharashtra": maharashtra,
    // ...
    // Note: If files are missing in real env, this breaks. Assuming user has them as per imports.
    // Keeping imports as is.
    "Andhra Pradesh": andhraPradesh,
    "Maharashtra": maharashtra,
    "Karnataka": karnataka,
    "Tamil Nadu": tamilNadu,
    "Odisha": odisha
};

type UseLocationDataProps = {
    setValue: UseFormSetValue<RegistrationFormSchema>;
    watch: UseFormWatch<RegistrationFormSchema>;
};

export function useLocationData({ setValue, watch }: UseLocationDataProps) {
    const state = watch('state');
    const district = watch('district');
    const taluka = watch('taluka');
    const village = watch('village');
    const surveyNumber = watch('surveyNumber');
    const doorNumber = watch('doorNumber');
    const transactionType = watch('transactionType') as string;

    const [districts, setDistricts] = useState<string[]>([]);
    const [talukas, setTalukas] = useState<string[]>([]);
    const [villages, setVillages] = useState<string[]>([]);
    const [surveyNumbers, setSurveyNumbers] = useState<SurveyNumber[]>([]);
    const [doorNumbers, setDoorNumbers] = useState<DoorNumber[]>([]);

    const [selectedSurvey, setSelectedSurvey] = useState<SurveyNumber | null>(null);
    const [selectedDoor, setSelectedDoor] = useState<DoorNumber | null>(null);
    const [govtValue, setGovtValue] = useState<number | null>(null);
    const [estimatedFee, setEstimatedFee] = useState<number>(0);
    const [stampDutyRate, setStampDutyRate] = useState<number>(6.0);
    const [surveyOrDoor, setSurveyOrDoor] = useState<'survey' | 'door'>('survey');

    // Hydration Effects
    // 1. Districts (from State)
    useEffect(() => {
        if (state && locationData[state]) {
            // Always ensure districts are loaded if state is selected
            const data = locationData[state];
            setDistricts(data.districts.map(d => d.name));
            setStampDutyRate(data.stampDuty);
        } else if (!state) {
            setDistricts([]);
            setTalukas([]);
            setVillages([]);
            setSurveyNumbers([]);
            setDoorNumbers([]);

            // Clear selections and fees on state reset
            setGovtValue(null);
            setEstimatedFee(0);
            setStampDutyRate(0);
            setSelectedSurvey(null);
            setSelectedDoor(null);
        }
    }, [state]);

    // 2. Mandals (from District)
    useEffect(() => {
        if (state && district && locationData[state]) {
            const stateData = locationData[state];
            const distData = stateData?.districts.find(d => d.name === district);
            if (distData) {
                setTalukas(distData.mandals.map(m => m.name));
            }
        } else if (!district) {
            setTalukas([]);
        }
    }, [state, district]);

    // 3. Villages (from Mandal)
    useEffect(() => {
        if (state && district && taluka && locationData[state]) {
            const stateData = locationData[state];
            const distData = stateData?.districts.find(d => d.name === district);
            const mandalData = distData?.mandals.find(m => m.name === taluka);
            if (mandalData) {
                setVillages(mandalData.villages.map(v => v.name));
            }
        } else if (!taluka) {
            setVillages([]);
        }
    }, [state, district, taluka]);

    // 4. Survey/Door Numbers (from Village)
    useEffect(() => {
        if (state && district && taluka && village && locationData[state]) {
            const stateData = locationData[state];
            const distData = stateData?.districts.find(d => d.name === district);
            const mandalData = distData?.mandals.find(m => m.name === taluka);
            const villageData = mandalData?.villages.find(v => v.name === village);
            if (villageData) {
                setSurveyNumbers(villageData.surveyNumbers);
                setDoorNumbers(villageData.doorNumbers || []);
            }
        } else if (!village) {
            setSurveyNumbers([]);
            setDoorNumbers([]);
        }
    }, [state, district, taluka, village]);

    // 5. Selected Survey/Door Details (Re-calculate fees on rehydration)
    useEffect(() => {
        if (surveyNumber && surveyNumbers.length > 0) {
            const survey = surveyNumbers.find(s => s.number === surveyNumber);
            if (survey) {
                setSelectedSurvey(survey);
                const fee = (survey.govtValue * (stampDutyRate / 100));
                setEstimatedFee(fee);
                setGovtValue(survey.govtValue);
            }
        }
        if (doorNumber && doorNumbers.length > 0) {
            const door = doorNumbers.find(d => d.number === doorNumber);
            if (door) {
                setSelectedDoor(door);
                setGovtValue(door.govtValue);
                // Fee calc moved to new effect
            }
        }
    }, [surveyNumber, doorNumber, surveyNumbers, doorNumbers]);

    // 6. Calculate Total Fee (Estimated Fee)
    useEffect(() => {
        if (govtValue) {
            // 1. Stamp Duty
            const stampDuty = (govtValue * (stampDutyRate / 100));

            // 2. Registration Fee (0.1% of Govt Value, min 1000)
            const registrationFee = Math.max(1000, govtValue * 0.001);

            // 3. Deed Document Fee
            let deedDocFee = 200; // Default
            if (transactionType) {
                switch (transactionType.toLowerCase()) {
                    case 'sale': deedDocFee = 200; break;
                    case 'gift': deedDocFee = 1500; break;
                    case 'partition': deedDocFee = 500; break;
                    case 'lease': deedDocFee = 200; break;
                    case 'mortgage': deedDocFee = 500; break;
                    case 'exchange': deedDocFee = 500; break;
                    default: deedDocFee = 200; break;
                }
            }

            // Total
            setEstimatedFee(stampDuty + registrationFee + deedDocFee);

            // Sync with RHF
            setValue('stampDuty', stampDuty.toFixed(2));
            setValue('registrationFee', registrationFee.toFixed(2));

        } else {
            setEstimatedFee(0);
            setValue('stampDuty', ''); // Clear RHF value
            setValue('registrationFee', ''); // Clear RHF value
        }
    }, [govtValue, stampDutyRate, transactionType, setValue]);

    const handleLocationChange = (field: keyof RegistrationFormSchema, value: string) => {
        setValue(field, value, { shouldValidate: true });

        if (field === 'state') {
            setValue('district', '');
            setValue('taluka', '');
            setValue('village', '');
            setValue('surveyNumber', '');
            setValue('doorNumber', '');
            setGovtValue(null);
            setEstimatedFee(0);
        } else if (field === 'district') {
            setValue('taluka', '');
            setValue('village', '');
            setValue('surveyNumber', '');
        } else if (field === 'taluka') {
            setValue('village', '');
            setValue('surveyNumber', '');
        } else if (field === 'village') {
            setValue('surveyNumber', '');
            setValue('doorNumber', '');
        } else if (field === 'surveyNumber') {
            const survey = surveyNumbers.find(s => s.number === value);
            if (survey) {
                setValue('considerationAmount', survey.govtValue.toString());
                // Calculations handled by useEffect now
            }
        } else if (field === 'doorNumber') {
            const door = doorNumbers.find(d => d.number === value);
            if (door) {
                setValue('considerationAmount', door.govtValue.toString());
                // Calculations handled by useEffect now
            }
        }
    };

    const handleSurveyDoorToggle = (type: 'survey' | 'door') => {
        setSurveyOrDoor(type);
        setValue('surveyNumber', '');
        setValue('doorNumber', '');
        setValue('considerationAmount', '');
        setValue('stampDuty', '');
        setValue('registrationFee', '');

        setGovtValue(null);
        setSelectedSurvey(null);
        setSelectedDoor(null);
        setEstimatedFee(0);
    };

    return {
        districts, talukas, villages, surveyNumbers, doorNumbers,
        selectedSurvey, selectedDoor, govtValue, estimatedFee, stampDutyRate,
        surveyOrDoor, setSurveyOrDoor,
        handleLocationChange, handleSurveyDoorToggle,
        locationData
    };
}
