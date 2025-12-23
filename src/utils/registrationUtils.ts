export const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}min ${seconds}s`;
};

export const calculateProgress = (
    currentStep: number,
    submitSuccess: boolean,
    paymentVerified: 'idle' | 'valid' | 'invalid',
    declarationChecked: boolean
): number => {
    if (submitSuccess) return 100;
    let progress = 0;
    if (currentStep > 1) progress += 45;
    if (currentStep > 2) progress += 45;
    if (currentStep === 3 || submitSuccess) {
        if (paymentVerified === 'valid') progress += 5;
        if (declarationChecked) progress += 4;
    }
    return progress;
};
