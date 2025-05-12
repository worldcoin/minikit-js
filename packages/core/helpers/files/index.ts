import { ShareInput, SharePayload } from '../../types/commands';

const MAX_FILES = 10;
const MAX_TOTAL_SIZE_MB = 50;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

// Helper function to process a single file to base64
const processFile = async (
  file: File,
): Promise<{ name: string; type: string; data: string }> => {
  const buffer = await file.arrayBuffer();
  // Convert ArrayBuffer to binary string
  const binaryString = String.fromCharCode(...new Uint8Array(buffer));
  const base64Data = btoa(binaryString);
  return {
    name: file.name,
    type: file.type,
    data: base64Data,
  };
};

export const formatShareInput = async (
  input: ShareInput,
): Promise<SharePayload> => {
  if (!input.files) {
    throw new Error('No files provided');
  }

  if (input.files.length === 0) {
    // Handle case with no files, if navigator.share allows title/text/url sharing without files
    // Or throw an error if files are always required by your use case
    // For now, proceed assuming title/text/url can be shared alone
  } else {
    if (input.files.length > MAX_FILES) {
      throw new Error(`Cannot share more than ${MAX_FILES} files.`);
    }

    let totalSize = 0;
    for (const file of input.files) {
      totalSize += file.size; // File.size is in bytes
    }

    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      throw new Error(`Total file size cannot exceed ${MAX_TOTAL_SIZE_MB}MB.`);
    }
  }

  const fileProcessingPromises = input.files.map((file) => processFile(file));
  const processedFiles = await Promise.all(fileProcessingPromises);

  return {
    files: processedFiles,
    title: input.title,
    text: input.text,
    url: input.url,
  };
};
