import { logger } from '@/utils/logger';
import { RegistrationFormSchema } from '@/lib/validations/registrationSchema';

export const downloadSummary = async (formData: RegistrationFormSchema, registrationId: string) => {
    const summary = `
LAND REGISTRATION SUMMARY
=========================

DEED DETAILS
----------------
Survey Number: ${formData.surveyNumber || 'N/A'}
Door Number: ${formData.doorNumber || 'N/A'}
Location: ${formData.village}, ${formData.taluka}, ${formData.district}, ${formData.state}
Transaction Type: ${formData.transactionType || 'N/A'}

Government Value: ₹${formData.considerationAmount || 'N/A'}
Stamp Duty: ₹${formData.stampDuty || 'N/A'}
Registration Fee: ₹${formData.registrationFee || 'N/A'}

Seller Details
--------------
Aadhar: ${formData.sellerAadhar || 'N/A'}
Phone: ${formData.sellerPhone || 'N/A'}

Buyer Details
-------------
Aadhar: ${formData.buyerAadhar || 'N/A'}
Phone: ${formData.buyerPhone || 'N/A'}

DOCUMENTS UPLOADED
------------------
${Object.entries(formData.documents)
            .map(([key, file]) => `${key}: ${file ? file.name : 'Not uploaded'}`)
            .join('\n')}

PROPERTY PHOTOS
---------------
${formData.propertyPhotos.length} photo(s) uploaded

Generated on: ${new Date().toLocaleString()}
Registration ID: ${registrationId || 'PENDING'}
    `;

    try {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        zip.file('registration-summary.txt', summary);

        const documentsFolder = zip.folder('documents');
        if (documentsFolder) {
            for (const file of Object.values(formData.documents)) {
                if (file) {
                    const fileData = await file.arrayBuffer();
                    documentsFolder.file(file.name, fileData);
                }
            }
        }

        const photosFolder = zip.folder('property-photos');
        if (photosFolder) {
            for (let i = 0; i < formData.propertyPhotos.length; i++) {
                const photo = formData.propertyPhotos[i];
                const photoData = await photo.arrayBuffer();
                photosFolder.file(photo.name, photoData);
            }
        }

        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `land-registration-${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        logger.error('Error creating zip:', error);
        const blob = new Blob([summary], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `land-registration-summary-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};
