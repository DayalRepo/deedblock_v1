use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvar::{clock::Clock, Sysvar},
};

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("=== TITLEREG Land Registration ===");
    
    let instruction = TitleRegInstruction::unpack(instruction_data)?;
    
    match instruction {
        TitleRegInstruction::InitializeRegistration { 
            registration_id,
            survey_number,
            plot_number,
            village,
            taluka,
            district,
            state,
            pincode,
            property_type,
            area,
            area_unit,
            transaction_type,
            consideration_amount,
            stamp_duty,
            registration_fee,
            sale_agreement_date,
            seller_name,
            seller_father_name,
            buyer_name,
            buyer_father_name,
            documents_ipfs_hash,
            photos_ipfs_hash,
        } => {
            msg!("✓ Initialize Registration");
            msg!("  ID: {}", registration_id);
            msg!("  Survey: {}", survey_number);
            msg!("  Docs IPFS: {}", documents_ipfs_hash);
            msg!("  Photos IPFS: {}", photos_ipfs_hash);
            initialize_registration(
                program_id,
                accounts,
                registration_id,
                survey_number,
                plot_number,
                village,
                taluka,
                district,
                state,
                pincode,
                property_type,
                area,
                area_unit,
                transaction_type,
                consideration_amount,
                stamp_duty,
                registration_fee,
                sale_agreement_date,
                seller_name,
                seller_father_name,
                buyer_name,
                buyer_father_name,
                documents_ipfs_hash,
                photos_ipfs_hash,
            )
        }
        TitleRegInstruction::UpdateStatus { status } => {
            msg!("✓ Update Status: {}", status);
            update_status(accounts, status)
        }
        TitleRegInstruction::UpdateDocumentsCid { cid } => {
            msg!("✓ Update Documents IPFS CID: {}", cid);
            update_documents_cid(accounts, cid)
        }
        TitleRegInstruction::UpdatePhotosCid { cid } => {
            msg!("✓ Update Photos IPFS CID: {}", cid);
            update_photos_cid(accounts, cid)
        }
    }
}

enum TitleRegInstruction {
    InitializeRegistration {
        registration_id: String,
        survey_number: String,
        plot_number: String,
        village: String,
        taluka: String,
        district: String,
        state: String,
        pincode: String,
        property_type: String,
        area: String,
        area_unit: String,
        transaction_type: String,
        consideration_amount: String,
        stamp_duty: String,
        registration_fee: String,
        sale_agreement_date: String,
        seller_name: String,
        seller_father_name: String,
        buyer_name: String,
        buyer_father_name: String,
        documents_ipfs_hash: String,
        photos_ipfs_hash: String,
    },
    UpdateStatus { status: u8 },
    UpdateDocumentsCid { cid: String },
    UpdatePhotosCid { cid: String },
}

impl TitleRegInstruction {
    fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (&variant, rest) = input
            .split_first()
            .ok_or(ProgramError::InvalidInstructionData)?;
        
        Ok(match variant {
            0 => {
                let (registration_id, rest) = unpack_string(rest)?;
                let (survey_number, rest) = unpack_string(rest)?;
                let (plot_number, rest) = unpack_string(rest)?;
                let (village, rest) = unpack_string(rest)?;
                let (taluka, rest) = unpack_string(rest)?;
                let (district, rest) = unpack_string(rest)?;
                let (state, rest) = unpack_string(rest)?;
                let (pincode, rest) = unpack_string(rest)?;
                let (property_type, rest) = unpack_string(rest)?;
                let (area, rest) = unpack_string(rest)?;
                let (area_unit, rest) = unpack_string(rest)?;
                let (transaction_type, rest) = unpack_string(rest)?;
                let (consideration_amount, rest) = unpack_string(rest)?;
                let (stamp_duty, rest) = unpack_string(rest)?;
                let (registration_fee, rest) = unpack_string(rest)?;
                let (sale_agreement_date, rest) = unpack_string(rest)?;
                let (seller_name, rest) = unpack_string(rest)?;
                let (seller_father_name, rest) = unpack_string(rest)?;
                let (buyer_name, rest) = unpack_string(rest)?;
                let (buyer_father_name, rest) = unpack_string(rest)?;
                let (documents_ipfs_hash, rest) = unpack_string(rest)?;
                let (photos_ipfs_hash, _) = unpack_string(rest)?;
                
                TitleRegInstruction::InitializeRegistration {
                    registration_id,
                    survey_number,
                    plot_number,
                    village,
                    taluka,
                    district,
                    state,
                    pincode,
                    property_type,
                    area,
                    area_unit,
                    transaction_type,
                    consideration_amount,
                    stamp_duty,
                    registration_fee,
                    sale_agreement_date,
                    seller_name,
                    seller_father_name,
                    buyer_name,
                    buyer_father_name,
                    documents_ipfs_hash,
                    photos_ipfs_hash,
                }
            }
            1 => {
                let status = rest[0];
                TitleRegInstruction::UpdateStatus { status }
            }
            2 => {
                let (cid, _) = unpack_string(rest)?;
                TitleRegInstruction::UpdateDocumentsCid { cid }
            }
            3 => {
                let (cid, _) = unpack_string(rest)?;
                TitleRegInstruction::UpdatePhotosCid { cid }
            }
            _ => return Err(ProgramError::InvalidInstructionData),
        })
    }
}

fn unpack_string(input: &[u8]) -> Result<(String, &[u8]), ProgramError> {
    if input.len() < 4 {
        return Err(ProgramError::InvalidInstructionData);
    }
    
    let len = u32::from_le_bytes([input[0], input[1], input[2], input[3]]) as usize;
    
    if input.len() < 4 + len {
        return Err(ProgramError::InvalidInstructionData);
    }
    
    let bytes = &input[4..4 + len];
    let string = String::from_utf8(bytes.to_vec())
        .map_err(|_| ProgramError::InvalidInstructionData)?;
    
    Ok((string, &input[4 + len..]))
}

fn initialize_registration(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    registration_id: String,
    survey_number: String,
    plot_number: String,
    village: String,
    taluka: String,
    district: String,
    state: String,
    pincode: String,
    property_type: String,
    area: String,
    area_unit: String,
    transaction_type: String,
    consideration_amount: String,
    stamp_duty: String,
    registration_fee: String,
    sale_agreement_date: String,
    seller_name: String,
    seller_father_name: String,
    buyer_name: String,
    buyer_father_name: String,
    documents_ipfs_hash: String,
    photos_ipfs_hash: String,
) -> ProgramResult {
    msg!("Initializing land registration...");
    
    let account_info_iter = &mut accounts.iter();
    let registration = next_account_info(account_info_iter)?;
    let authority = next_account_info(account_info_iter)?;
    let _system_program = next_account_info(account_info_iter)?;
    
    if !authority.is_signer {
        msg!("✗ Error: Authority must sign transaction");
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    msg!("Authority: {}", authority.key);
    msg!("Registration Account: {}", registration.key);
    
    let clock = Clock::get()?;
    msg!("Timestamp: {}", clock.unix_timestamp);
    
    let mut registration_data = vec![1u8];
    registration_data.extend_from_slice(authority.key.as_ref());
    pack_string(&mut registration_data, &registration_id);
    pack_string(&mut registration_data, &survey_number);
    pack_string(&mut registration_data, &plot_number);
    pack_string(&mut registration_data, &village);
    pack_string(&mut registration_data, &taluka);
    pack_string(&mut registration_data, &district);
    pack_string(&mut registration_data, &state);
    pack_string(&mut registration_data, &pincode);
    pack_string(&mut registration_data, &property_type);
    pack_string(&mut registration_data, &area);
    pack_string(&mut registration_data, &area_unit);
    pack_string(&mut registration_data, &transaction_type);
    pack_string(&mut registration_data, &consideration_amount);
    pack_string(&mut registration_data, &stamp_duty);
    pack_string(&mut registration_data, &registration_fee);
    pack_string(&mut registration_data, &sale_agreement_date);
    pack_string(&mut registration_data, &seller_name);
    pack_string(&mut registration_data, &seller_father_name);
    pack_string(&mut registration_data, &buyer_name);
    pack_string(&mut registration_data, &buyer_father_name);
    pack_string(&mut registration_data, &documents_ipfs_hash);
    pack_string(&mut registration_data, &photos_ipfs_hash);
    registration_data.push(0u8);
    registration_data.extend_from_slice(&clock.unix_timestamp.to_le_bytes());
    
    msg!("✓ Data packed ({} bytes)", registration_data.len());
    
    // Write data to the account
    let mut account_data = registration.data.borrow_mut();
    if registration_data.len() > account_data.len() {
        msg!("✗ Error: Account too small. Need {}, have {}", registration_data.len(), account_data.len());
        return Err(ProgramError::InvalidAccountData);
    }
    account_data[..registration_data.len()].copy_from_slice(&registration_data);
    
    msg!("✓ Registration initialized successfully");
    
    Ok(())
}

fn update_status(accounts: &[AccountInfo], status: u8) -> ProgramResult {
    msg!("Updating registration status...");
    
    let account_info_iter = &mut accounts.iter();
    let registration = next_account_info(account_info_iter)?;
    let authority = next_account_info(account_info_iter)?;
    
    if !authority.is_signer {
        msg!("✗ Error: Authority must sign transaction");
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    let data = registration.data.borrow();
    if data[0] == 0 {
        msg!("✗ Error: Account not initialized");
        return Err(TitleRegError::NotInitialized.into());
    }
    
    let stored_authority = Pubkey::try_from(&data[1..33])
        .map_err(|_| ProgramError::InvalidAccountData)?;
    if *authority.key != stored_authority {
        msg!("✗ Error: Unauthorized");
        return Err(TitleRegError::Unauthorized.into());
    }
    
    msg!("✓ Status: {} (0=pending, 1=active, 2=verified)", status);
    Ok(())
}

fn update_documents_cid(accounts: &[AccountInfo], cid: String) -> ProgramResult {
    msg!("Updating Documents IPFS CID...");
    
    let account_info_iter = &mut accounts.iter();
    let registration = next_account_info(account_info_iter)?;
    let authority = next_account_info(account_info_iter)?;
    
    if !authority.is_signer {
        msg!("✗ Error: Authority must sign transaction");
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    let data = registration.data.borrow();
    if data[0] == 0 {
        msg!("✗ Error: Account not initialized");
        return Err(TitleRegError::NotInitialized.into());
    }
    
    let stored_authority = Pubkey::try_from(&data[1..33])
        .map_err(|_| ProgramError::InvalidAccountData)?;
    if *authority.key != stored_authority {
        msg!("✗ Error: Unauthorized");
        return Err(TitleRegError::Unauthorized.into());
    }
    
    msg!("✓ Documents IPFS CID updated: {}", cid);
    Ok(())
}

fn update_photos_cid(accounts: &[AccountInfo], cid: String) -> ProgramResult {
    msg!("Updating Photos IPFS CID...");
    
    let account_info_iter = &mut accounts.iter();
    let registration = next_account_info(account_info_iter)?;
    let authority = next_account_info(account_info_iter)?;
    
    if !authority.is_signer {
        msg!("✗ Error: Authority must sign transaction");
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    let data = registration.data.borrow();
    if data[0] == 0 {
        msg!("✗ Error: Account not initialized");
        return Err(TitleRegError::NotInitialized.into());
    }
    
    let stored_authority = Pubkey::try_from(&data[1..33])
        .map_err(|_| ProgramError::InvalidAccountData)?;
    if *authority.key != stored_authority {
        msg!("✗ Error: Unauthorized");
        return Err(TitleRegError::Unauthorized.into());
    }
    
    msg!("✓ Photos IPFS CID updated: {}", cid);
    Ok(())
}

fn pack_string(data: &mut Vec<u8>, string: &str) {
    let bytes = string.as_bytes();
    data.extend_from_slice(&(bytes.len() as u32).to_le_bytes());
    data.extend_from_slice(bytes);
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TitleRegError {
    NotInitialized = 100,
    Unauthorized = 101,
}

impl From<TitleRegError> for ProgramError {
    fn from(e: TitleRegError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pack_unpack_string() {
        let mut data = Vec::new();
        pack_string(&mut data, "test");
        let (unpacked, _) = unpack_string(&data).unwrap();
        assert_eq!(unpacked, "test");
    }
}

